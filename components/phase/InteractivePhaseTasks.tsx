"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3 } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import type { PhaseTask } from '@/lib/mockPhaseDetail';

type TaskStatus = 'not_started' | 'in_progress' | 'completed';

type InteractivePhaseTasksProps = {
  tasks: PhaseTask[];
  goal: string;
  mode?: 'lite' | 'deep';
  courseId?: string;
  phaseIndex: number;
  phaseName: string;
};

type TaskProgressApiItem = {
  taskIndex: number;
  taskTitle: string;
  status: TaskStatus;
};

const statusLabels: Record<TaskStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
};

const statusOptions: TaskStatus[] = ['not_started', 'in_progress', 'completed'];

function buildStorageKey(goal: string, phaseIndex: number, phaseName: string) {
  return `ailines-phase-tasks:${encodeURIComponent(goal)}:${phaseIndex}:${encodeURIComponent(phaseName)}`;
}

function createInitialStatuses(taskCount: number) {
  return Array.from({ length: taskCount }).reduce<Record<number, TaskStatus>>((acc, _task, index) => {
    acc[index] = 'not_started';
    return acc;
  }, {});
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'not_started' || value === 'in_progress' || value === 'completed';
}

function parseStoredStatuses(value: string | null, taskCount: number) {
  const fallback = createInitialStatuses(taskCount);

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.keys(fallback).reduce<Record<number, TaskStatus>>((acc, key) => {
      const index = Number(key);
      const storedStatus = parsed[key];
      acc[index] = isTaskStatus(storedStatus) ? storedStatus : 'not_started';
      return acc;
    }, {});
  } catch {
    return fallback;
  }
}

function apiItemsToStatuses(items: TaskProgressApiItem[], taskCount: number) {
  const next = createInitialStatuses(taskCount);
  for (const item of items) {
    if (Number.isInteger(item.taskIndex) && item.taskIndex >= 0 && item.taskIndex < taskCount && isTaskStatus(item.status)) {
      next[item.taskIndex] = item.status;
    }
  }
  return next;
}

function hasAnySavedStatus(statuses: Record<number, TaskStatus>) {
  return Object.values(statuses).some((status) => status !== 'not_started');
}

export function InteractivePhaseTasks({ tasks, goal, mode = 'deep', courseId, phaseIndex, phaseName }: InteractivePhaseTasksProps) {
  const storageKey = useMemo(() => buildStorageKey(goal, phaseIndex, phaseName), [goal, phaseIndex, phaseName]);
  const [statuses, setStatuses] = useState<Record<number, TaskStatus>>(() => createInitialStatuses(tasks.length));
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [syncLabel, setSyncLabel] = useState('状态会自动保存');
  const latestSaveRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const localStatuses = parseStoredStatuses(window.localStorage.getItem(storageKey), tasks.length);
    setStatuses(localStatuses);
    setExpanded({});
    setHydrated(true);
    setSyncLabel('正在同步学习状态…');

    let cancelled = false;

    async function loadDatabaseStatuses() {
      const anonymousId = getOrCreateAnonymousId();
      const params = new URLSearchParams({
        anonymousId,
        goal,
        mode,
        phaseIndex: String(phaseIndex),
        phaseName,
      });
      if (courseId) params.set('courseId', courseId);

      try {
        const response = await fetch(`/api/task-progress?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('task progress api failed');
        const data = await response.json() as { items?: TaskProgressApiItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (cancelled) return;

        if (items.length > 0) {
          const databaseStatuses = apiItemsToStatuses(items, tasks.length);
          setStatuses(databaseStatuses);
          window.localStorage.setItem(storageKey, JSON.stringify(databaseStatuses));
          setSyncLabel('已恢复任务状态');
        } else {
          setSyncLabel(hasAnySavedStatus(localStatuses) ? '已恢复本地任务状态' : '状态会自动保存');
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Task progress database load failed; using localStorage fallback.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('已保留本地任务状态');
        }
      }
    }

    loadDatabaseStatuses();

    return () => {
      cancelled = true;
    };
  }, [storageKey, tasks.length, goal, mode, courseId, phaseIndex, phaseName]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(statuses));
  }, [hydrated, statuses, storageKey]);

  const completedCount = tasks.filter((_task, index) => statuses[index] === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function saveStatusToDatabase(index: number, status: TaskStatus) {
    const version = Date.now();
    latestSaveRef.current[index] = version;
    const anonymousId = getOrCreateAnonymousId();

    fetch('/api/task-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: courseId || undefined,
        anonymousId,
        goal,
        mode,
        phaseIndex,
        phaseName,
        taskIndex: index,
        taskTitle: tasks[index]?.title || `任务 ${index + 1}`,
        status,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('task progress save failed');
        if (latestSaveRef.current[index] === version) setSyncLabel('已保存任务状态');
      })
      .catch((error) => {
        if (latestSaveRef.current[index] === version) {
          console.warn('Task progress database save failed; localStorage fallback kept.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('已保留本地任务状态');
        }
      });
  }

  function updateStatus(index: number, status: TaskStatus) {
    setStatuses((current) => {
      const next = {
        ...current,
        [index]: status,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setSyncLabel('正在保存任务状态…');
    saveStatusToDatabase(index, status);
  }

  function toggleExpanded(index: number) {
    setExpanded((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">学习安排</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">按任务推进，形成稳定产出</h2>
      </div>

      <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-sky-900">
            阶段任务进度：{completedCount}/{totalCount} 已完成 · {progressPercent}%
          </p>
          <p className="text-xs font-medium text-sky-700">{syncLabel}</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-sky-700 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tasks.map((task, index) => {
          const status = statuses[index] || 'not_started';
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          const isExpanded = Boolean(expanded[index]);

          return (
            <article
              key={`${task.title}-${index}`}
              className={`cursor-pointer rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : isInProgress
                    ? 'border-sky-200 bg-sky-50/70'
                    : 'border-slate-200 bg-slate-50'
              }`}
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    isCompleted ? 'bg-emerald-600' : isInProgress ? 'bg-sky-700' : 'bg-sky-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
                    <span
                      className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isInProgress
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-white text-slate-600'
                      }`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                    <Clock3 className="h-3.5 w-3.5 text-sky-700" />
                    {task.duration}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{task.description}</p>
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium leading-6 text-slate-700">产出物：{task.output}</p>

                  <div className="mt-4 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    {statusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateStatus(index, option)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                          status === option
                            ? option === 'completed'
                              ? 'border-emerald-200 bg-emerald-600 text-white'
                              : option === 'in_progress'
                                ? 'border-sky-200 bg-sky-700 text-white'
                                : 'border-slate-300 bg-slate-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-800'
                        }`}
                      >
                        {statusLabels[option]}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpanded(index);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-800 transition hover:text-sky-900 focus:outline-none"
                  >
                    {isExpanded ? '收起详情' : '展开详情'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="mt-5 grid gap-3 border-t border-white/80 pt-4 text-sm leading-6 text-slate-700 md:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-semibold text-slate-950">行动步骤</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4">
                      <li>阅读任务说明</li>
                      <li>完成对应学习或练习</li>
                      <li>整理当前任务产出物</li>
                    </ol>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-semibold text-slate-950">完成检查</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      <li>我能说清楚这个任务的目标</li>
                      <li>我已经完成产出物</li>
                      <li>我知道下一步要做什么</li>
                    </ul>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-semibold text-slate-950">记录提示</p>
                    <p className="mt-2">可以把疑问整理后点击“问 AILINES AI”继续追问，也可以记录本任务遇到的卡点。</p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { ProgressHeader } from '@/components/ProgressHeader';
import { ProgressOverview } from '@/components/ProgressOverview';
import { getLearningCardKey, ProgressStageCard, type LearningCardStatusByKey } from '@/components/ProgressStageCard';
import type { CourseProgressSummary } from '@/lib/course/courseProgressRepository';
import type { LearningCardProgressItem, LearningCardStatus } from '@/lib/course/learningCardProgressRepository';
import { getProgressStagesByGoal } from '@/lib/mockProgress';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';
import { clearProgressState, loadProgressState, saveProgressState } from '@/lib/progressStorage';

type ProgressTrackerProps = {
  goal: string;
  mode: 'lite' | 'deep';
  courseId?: string;
  anonymousId?: string;
  title: string;
  courseProgress?: CourseProgressSummary | null;
};

function topicStorageKey(goal: string, phaseName: string, topic: string) {
  return `ailines-progress-topic:${goal}:${phaseName}:${topic}`;
}

function itemsToStatuses(items: LearningCardProgressItem[]) {
  return items.reduce<LearningCardStatusByKey>((acc, item) => {
    acc[getLearningCardKey(item.phaseIndex - 1, item.topicIndex)] = item.status;
    return acc;
  }, {});
}

export function ProgressTracker({ goal, mode, courseId, anonymousId: initialAnonymousId, title, courseProgress }: ProgressTrackerProps) {
  const [statuses, setStatuses] = useState<LearningCardStatusByKey>({});
  const [anonymousId, setAnonymousId] = useState(initialAnonymousId || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncLabel, setSyncLabel] = useState('学习状态会自动保存');

  const progressStages = useMemo(() => getProgressStagesByGoal(goal), [goal]);
  const allTopics = useMemo(() => progressStages.flatMap((stage, phaseIndex) => stage.tasks.map((task, topicIndex) => ({ stage, task, phaseIndex, topicIndex }))), [progressStages]);
  const totalCount = allTopics.length;
  const completedCount = allTopics.filter(({ phaseIndex, topicIndex }) => statuses[getLearningCardKey(phaseIndex, topicIndex)] === 'completed').length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  function persistLocal(next: LearningCardStatusByKey) {
    const completedIds = allTopics
      .filter(({ phaseIndex, topicIndex }) => next[getLearningCardKey(phaseIndex, topicIndex)] === 'completed')
      .map(({ task }) => task.id);
    saveProgressState(goal, completedIds);

    for (const { stage, task, phaseIndex, topicIndex } of allTopics) {
      const status = next[getLearningCardKey(phaseIndex, topicIndex)] || 'not_started';
      const key = topicStorageKey(goal, stage.title, task.title);
      if (status === 'not_started') window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, status);
    }
  }

  function loadLocalStatuses() {
    const completedTaskIds = loadProgressState(goal);
    const next: LearningCardStatusByKey = {};
    for (const { stage, task, phaseIndex, topicIndex } of allTopics) {
      const key = topicStorageKey(goal, stage.title, task.title);
      const topicState = window.localStorage.getItem(key);
      if (topicState === 'completed' || completedTaskIds.includes(task.id)) next[getLearningCardKey(phaseIndex, topicIndex)] = 'completed';
      else if (topicState === 'in_progress') next[getLearningCardKey(phaseIndex, topicIndex)] = 'in_progress';
    }
    return next;
  }

  useEffect(() => {
    const localStatuses = loadLocalStatuses();
    setStatuses(localStatuses);
    setIsLoaded(true);
    setSyncLabel('正在同步数据库状态...');
    let cancelled = false;

    async function loadDb() {
      const currentAnonymousId = initialAnonymousId || getOrCreateAnonymousId();
      setAnonymousId(currentAnonymousId);
      const params = new URLSearchParams({ anonymousId: currentAnonymousId, goal, mode });
      if (courseId) params.set('courseId', courseId);
      try {
        const response = await fetch(`/api/learning-card-progress?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('learning card progress api failed');
        const data = await response.json() as { items?: LearningCardProgressItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (cancelled) return;
        if (items.length > 0) {
          const dbStatuses = itemsToStatuses(items);
          setStatuses(dbStatuses);
          persistLocal(dbStatuses);
          setSyncLabel('已从数据库恢复学习卡片状态');
        } else {
          setSyncLabel(Object.keys(localStatuses).length ? '数据库暂无记录，已使用本地缓存' : '学习状态会自动保存到数据库');
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Learning card progress database load failed; using localStorage fallback.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('数据库暂不可用，已使用本地缓存');
        }
      }
    }
    loadDb();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, mode, courseId, initialAnonymousId, allTopics.length]);

  useEffect(() => {
    if (!isLoaded) return;
    persistLocal(statuses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, isLoaded]);

  function saveToDatabase(phaseIndex: number, topicIndex: number, status: LearningCardStatus) {
    const item = allTopics.find((topic) => topic.phaseIndex === phaseIndex && topic.topicIndex === topicIndex);
    if (!item) return;
    const currentAnonymousId = anonymousId || getOrCreateAnonymousId();
    if (!anonymousId) setAnonymousId(currentAnonymousId);
    fetch('/api/learning-card-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: courseId || undefined,
        anonymousId: currentAnonymousId,
        goal,
        mode,
        phaseIndex: phaseIndex + 1,
        phaseName: item.stage.title,
        topicIndex,
        topicTitle: item.task.title,
        status,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('learning card progress save failed');
        setSyncLabel('已保存到数据库');
      })
      .catch((error) => {
        console.warn('Learning card progress database save failed; localStorage fallback kept.', error instanceof Error ? error.message : 'unknown');
        setSyncLabel('数据库保存失败，已保留本地缓存');
      });
  }

  function setTopicStatus(phaseIndex: number, topicIndex: number, status: LearningCardStatus) {
    setStatuses((current) => ({ ...current, [getLearningCardKey(phaseIndex, topicIndex)]: status }));
    setSyncLabel('正在保存到数据库...');
    saveToDatabase(phaseIndex, topicIndex, status);
  }

  function resetProgress() {
    if (!confirm('确定要重置当前学习进度吗？')) return;
    clearProgressState(goal);
    for (const { stage, task } of allTopics) window.localStorage.removeItem(topicStorageKey(goal, stage.title, task.title));
    setStatuses({});
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ProgressHeader goal={goal} mode={mode} courseId={courseId} title={title} />
        <AilinesGeneratingState type="progress" compact estimatedSeconds={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ProgressHeader goal={goal} mode={mode} courseId={courseId} title={title} />
      {courseProgress ? (
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">课程总进度</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="text-5xl font-semibold tracking-tight text-slate-950">{courseProgress.overallPercent}%</p>
                <p className="pb-1 text-base font-medium text-slate-600">已完成 {courseProgress.completedCount} / {courseProgress.totalCount} 项</p>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                {courseProgress.lastTopicTitle ? `最近学习：${courseProgress.lastTopicTitle}` : courseProgress.lastPhaseName ? `最近学习：${courseProgress.lastPhaseName}` : '最近学习位置会在访问课程页面时自动记录'}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 lg:w-64">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${courseProgress.overallPercent}%` }} />
            </div>
          </div>
        </section>
      ) : null}
      <ProgressOverview completedCount={completedCount} totalCount={totalCount} percent={percent} onReset={resetProgress} syncLabel={syncLabel} />
      <section className="grid gap-6 lg:grid-cols-2">
        {progressStages.map((stage, phaseIndex) => (
          <ProgressStageCard key={stage.id} stage={stage} goal={goal} mode={mode} courseId={courseId} anonymousId={anonymousId || initialAnonymousId} phaseIndex={phaseIndex} statuses={statuses} onSetTopicStatus={setTopicStatus} />
        ))}
      </section>
    </div>
  );
}

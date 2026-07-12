'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import type { PhaseStep } from '@/lib/mockPhaseDetail';

type UnderstandingStatus = 'unset' | 'understood' | 'review';

type InteractiveLearningStepsProps = {
  steps: PhaseStep[];
  goal: string;
  mode?: 'lite' | 'deep';
  courseId?: string;
  phaseIndex: number;
  phaseName: string;
  commonMistakes?: string[];
};

type LearningStepProgressApiItem = {
  stepIndex: number;
  stepTitle: string;
  status: UnderstandingStatus;
};

function buildStorageKey(goal: string, mode: string, phaseIndex: number, phaseName: string) {
  return `ailines-phase-step-understanding:${encodeURIComponent(goal)}:${mode || 'deep'}:${phaseIndex}:${encodeURIComponent(phaseName)}`;
}

function buildLegacyStorageKey(goal: string, phaseIndex: number, phaseName: string) {
  return `ailines-phase-step-understanding:${encodeURIComponent(goal)}:${phaseIndex}:${encodeURIComponent(phaseName)}`;
}

function isStatus(value: unknown): value is UnderstandingStatus {
  return value === 'unset' || value === 'understood' || value === 'review';
}

function parseStoredStatus(value: string | null, stepCount: number) {
  const fallback: Record<number, UnderstandingStatus> = {};

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Array.from({ length: stepCount }).reduce<Record<number, UnderstandingStatus>>((acc, _item, index) => {
      const stored = parsed[String(index)];
      if (isStatus(stored) && stored !== 'unset') {
        acc[index] = stored;
      }
      return acc;
    }, {});
  } catch {
    return fallback;
  }
}

function apiItemsToStatuses(items: LearningStepProgressApiItem[], stepCount: number) {
  const next: Record<number, UnderstandingStatus> = {};
  for (const item of items) {
    if (Number.isInteger(item.stepIndex) && item.stepIndex >= 0 && item.stepIndex < stepCount && isStatus(item.status) && item.status !== 'unset') {
      next[item.stepIndex] = item.status;
    }
  }
  return next;
}

function compactStatuses(statuses: Record<number, UnderstandingStatus>) {
  return Object.keys(statuses).reduce<Record<string, UnderstandingStatus>>((acc, key) => {
    const status = statuses[Number(key)];
    if (isStatus(status) && status !== 'unset') {
      acc[key] = status;
    }
    return acc;
  }, {});
}

function hasAnySavedStatus(statuses: Record<number, UnderstandingStatus>) {
  return Object.values(statuses).some((status) => status === 'understood' || status === 'review');
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function InteractiveLearningSteps({ steps, goal, mode = 'deep', courseId, phaseIndex, phaseName, commonMistakes = [] }: InteractiveLearningStepsProps) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const storageKey = useMemo(() => buildStorageKey(goal, mode, phaseIndex, phaseName), [goal, mode, phaseIndex, phaseName]);
  const legacyStorageKey = useMemo(() => buildLegacyStorageKey(goal, phaseIndex, phaseName), [goal, phaseIndex, phaseName]);
  const [statuses, setStatuses] = useState<Record<number, UnderstandingStatus>>({});
  const [hydrated, setHydrated] = useState(false);
  const [syncLabel, setSyncLabel] = useState('理解状态会自动保存');
  const latestSaveRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
    const localStatuses = parseStoredStatus(stored, safeSteps.length);
    setStatuses(localStatuses);
    setHydrated(true);
    setSyncLabel('正在同步数据库状态...');

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
        const response = await fetch(`/api/learning-step-progress?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('learning step progress api failed');
        const data = await response.json() as { items?: LearningStepProgressApiItem[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (cancelled) return;

        if (items.length > 0) {
          const databaseStatuses = apiItemsToStatuses(items, safeSteps.length);
          setStatuses(databaseStatuses);
          window.localStorage.setItem(storageKey, JSON.stringify(compactStatuses(databaseStatuses)));
          setSyncLabel('已从数据库恢复学习状态');
        } else {
          setSyncLabel(hasAnySavedStatus(localStatuses) ? '数据库暂无记录，已使用本地缓存' : '理解状态会自动保存到数据库');
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Learning step progress database load failed; using localStorage fallback.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('数据库暂不可用，已使用本地缓存');
        }
      }
    }

    loadDatabaseStatuses();

    return () => {
      cancelled = true;
    };
  }, [storageKey, legacyStorageKey, safeSteps.length, goal, mode, courseId, phaseIndex, phaseName]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(compactStatuses(statuses)));
  }, [hydrated, statuses, storageKey]);

  const understoodCount = safeSteps.filter((_step, index) => statuses[index] === 'understood').length;
  const reviewCount = safeSteps.filter((_step, index) => statuses[index] === 'review').length;
  const totalCount = safeSteps.length;
  const progressPercent = totalCount > 0 ? Math.round((understoodCount / totalCount) * 100) : 0;

  function saveStatusToDatabase(index: number, status: UnderstandingStatus) {
    const version = Date.now();
    latestSaveRef.current[index] = version;
    const anonymousId = getOrCreateAnonymousId();

    fetch('/api/learning-step-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: courseId || undefined,
        anonymousId,
        goal,
        mode,
        phaseIndex,
        phaseName,
        stepIndex: index,
        stepTitle: safeSteps[index]?.title || `第 ${index + 1} 步`,
        status,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('learning step progress save failed');
        if (latestSaveRef.current[index] === version) setSyncLabel('已保存到数据库');
      })
      .catch((error) => {
        if (latestSaveRef.current[index] === version) {
          console.warn('Learning step progress database save failed; localStorage fallback kept.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('数据库保存失败，已保留本地缓存');
        }
      });
  }

  function updateStatus(index: number, status: UnderstandingStatus) {
    setStatuses((current) => {
      const next = { ...current };
      if (status === 'unset') {
        delete next[index];
      } else {
        next[index] = status;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(compactStatuses(next)));
      return next;
    });
    setSyncLabel('正在保存到数据库...');
    saveStatusToDatabase(index, status);
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">阶段分步学习</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">AILINES AI 分步讲解</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">先听懂这一步在解决什么，再看例子，最后用行动和检查点确认掌握。</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 lg:min-w-72">
          <p className="text-sm font-semibold text-sky-900">学习掌握：{understoodCount}/{totalCount} 已理解 · {reviewCount} 个需要复习</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-sky-700 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-sky-700">{syncLabel}</p>
        </div>
      </div>

      <div className="space-y-5">
        {safeSteps.map((step, index) => {
          const status = statuses[index] || 'unset';
          const isUnderstood = status === 'understood';
          const needsReview = status === 'review';
          const title = isNonEmptyText(step.title) ? step.title : `第 ${index + 1} 步`;
          const explanation = isNonEmptyText(step.explanation) ? step.explanation : '先理解本步骤的核心概念，再通过一个小练习把它转化为可检查的能力。';

          return (
            <article key={`${title}-${index}`} className={`rounded-2xl border p-5 transition ${isUnderstood ? 'border-emerald-200 bg-emerald-50/60' : needsReview ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${isUnderstood ? 'bg-emerald-600' : needsReview ? 'bg-amber-600' : 'bg-sky-700'}`}>
                  {isUnderstood ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Step {index + 1}</p>
                      <h3 className="mt-1 break-words text-xl font-semibold text-slate-950">{title}</h3>
                    </div>
                    {status !== 'unset' ? (
                      <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isUnderstood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                        {isUnderstood ? '已理解' : '需要复习'}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-sky-800">AILINES AI 讲解</p>
                    <p className="mt-2 break-words text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{explanation}</p>
                  </div>

                  {isNonEmptyText(step.example) ? (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                      <p className="font-semibold text-slate-950">示例</p>
                      <p className="mt-2 break-words">{step.example}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {isNonEmptyText(step.action) ? (
                      <div className="rounded-2xl border border-sky-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                        <p className="font-semibold text-sky-800">现在你要做</p>
                        <p className="mt-2 break-words">{step.action}</p>
                      </div>
                    ) : null}
                    {isNonEmptyText(step.check) ? (
                      <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                        <p className="font-semibold text-emerald-700">完成检查</p>
                        <p className="mt-2 break-words">{step.check}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(index, 'understood')}
                      className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${isUnderstood ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'}`}
                    >
                      已理解
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(index, 'review')}
                      className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-amber-100 ${needsReview ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'}`}
                    >
                      需要复习
                    </button>
                    {status !== 'unset' ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(index, 'unset')}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />取消标记
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {commonMistakes.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">常见错误</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
            {commonMistakes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { PhaseStep } from '@/lib/mockPhaseDetail';

type UnderstandingStatus = 'understood' | 'review';

type InteractiveLearningStepsProps = {
  steps: PhaseStep[];
  goal: string;
  phaseIndex: number;
  phaseName: string;
  commonMistakes?: string[];
};

function buildStorageKey(goal: string, phaseIndex: number, phaseName: string) {
  return `ailines-phase-step-understanding:${encodeURIComponent(goal)}:${phaseIndex}:${encodeURIComponent(phaseName)}`;
}

function isStatus(value: unknown): value is UnderstandingStatus {
  return value === 'understood' || value === 'review';
}

function parseStoredStatus(value: string | null, stepCount: number) {
  const fallback: Record<number, UnderstandingStatus | undefined> = {};

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Array.from({ length: stepCount }).reduce<Record<number, UnderstandingStatus | undefined>>((acc, _item, index) => {
      const stored = parsed[String(index)];
      if (isStatus(stored)) {
        acc[index] = stored;
      }
      return acc;
    }, {});
  } catch {
    return fallback;
  }
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function InteractiveLearningSteps({ steps, goal, phaseIndex, phaseName, commonMistakes = [] }: InteractiveLearningStepsProps) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const storageKey = useMemo(() => buildStorageKey(goal, phaseIndex, phaseName), [goal, phaseIndex, phaseName]);
  const [statuses, setStatuses] = useState<Record<number, UnderstandingStatus | undefined>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStatuses(parseStoredStatus(window.localStorage.getItem(storageKey), safeSteps.length));
    setHydrated(true);
  }, [storageKey, safeSteps.length]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const compact = Object.keys(statuses).reduce<Record<string, UnderstandingStatus>>((acc, key) => {
      const status = statuses[Number(key)];
      if (isStatus(status)) {
        acc[key] = status;
      }
      return acc;
    }, {});

    window.localStorage.setItem(storageKey, JSON.stringify(compact));
  }, [hydrated, statuses, storageKey]);

  const understoodCount = safeSteps.filter((_step, index) => statuses[index] === 'understood').length;
  const totalCount = safeSteps.length;
  const progressPercent = totalCount > 0 ? Math.round((understoodCount / totalCount) * 100) : 0;

  function updateStatus(index: number, status: UnderstandingStatus) {
    setStatuses((current) => ({
      ...current,
      [index]: status,
    }));
  }

  function clearStatus(index: number) {
    setStatuses((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">阶段分步学习</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">AILINES AI 分步讲解</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">先听懂这一步在解决什么，再看例子，最后用行动和检查点确认掌握。</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 lg:min-w-64">
          <p className="text-sm font-semibold text-sky-900">学习掌握：{understoodCount}/{totalCount} 已理解</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-sky-700 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-sky-700">理解状态会自动保存在当前浏览器</p>
        </div>
      </div>

      <div className="space-y-5">
        {safeSteps.map((step, index) => {
          const status = statuses[index];
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
                    {status ? (
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
                    {status ? (
                      <button
                        type="button"
                        onClick={() => clearStatus(index)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />重置
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

'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import type { ProgressStage } from '@/lib/mockProgress';
import type { LearningCardStatus } from '@/lib/course/learningCardProgressRepository';

export const topicProgressPrefix = 'ailines-progress-topic:';

export type LearningCardStatusByKey = Record<string, LearningCardStatus>;

type ProgressStageCardProps = {
  stage: ProgressStage;
  goal: string;
  mode: 'lite' | 'deep';
  courseId?: string;
  phaseIndex: number;
  statuses: LearningCardStatusByKey;
  onSetTopicStatus: (phaseIndex: number, topicIndex: number, status: LearningCardStatus) => void;
};

export function getLearningCardKey(phaseIndex: number, topicIndex: number) {
  return `${phaseIndex}:${topicIndex}`;
}

function createLearnHref(goal: string, mode: 'lite' | 'deep', courseId: string | undefined, stage: ProgressStage, phaseIndex: number, topic: string, topicIndex: number) {
  const params = new URLSearchParams({
    goal,
    mode,
    phaseName: stage.title,
    topic,
    phaseIndex: String(phaseIndex + 1),
    topicIndex: String(topicIndex + 1),
  });
  if (courseId) params.set('courseId', courseId);

  return `/learn?${params.toString()}`;
}

export function createTopicStorageKey(goal: string, phaseName: string, topic: string) {
  return `${topicProgressPrefix}${goal}:${phaseName}:${topic}`;
}

const statusLabel: Record<LearningCardStatus, string> = {
  not_started: '未学习',
  in_progress: '学习中',
  completed: '已完成',
};

function getActionLabel(status: LearningCardStatus) {
  if (status === 'completed') return '已学完';
  if (status === 'in_progress') return '继续学习';
  return '开始学习';
}

export function ProgressStageCard({ stage, goal, mode, courseId, phaseIndex, statuses, onSetTopicStatus }: ProgressStageCardProps) {
  const completedInStage = stage.tasks.filter((_task, topicIndex) => statuses[getLearningCardKey(phaseIndex, topicIndex)] === 'completed').length;

  return (
    <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-7">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">学习阶段</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{stage.title}</h2>
        </div>
        <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">
          {completedInStage} / {stage.tasks.length}
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {stage.tasks.map((task, topicIndex) => {
          const status = statuses[getLearningCardKey(phaseIndex, topicIndex)] || 'not_started';
          const checked = status === 'completed';
          const isLearning = status === 'in_progress';
          const learnHref = createLearnHref(goal, mode, courseId, stage, phaseIndex, task.title, topicIndex);
          const topicStorageKey = createTopicStorageKey(goal, stage.title, task.title);
          const actionLabel = getActionLabel(status);

          return (
            <li key={task.id}>
              <div
                className={`group rounded-2xl border p-4 transition hover:border-sky-200 hover:bg-sky-50/80 hover:shadow-sm ${checked ? 'border-emerald-200 bg-emerald-50/60' : isLearning ? 'border-sky-200 bg-sky-50/60' : 'border-slate-200 bg-slate-50'}`}
                data-topic-storage-key={topicStorageKey}
              >
                <Link
                  href={learnHref}
                  className="block rounded-2xl focus:outline-none focus:ring-4 focus:ring-sky-100"
                  onClick={() => {
                    if (!checked) onSetTopicStatus(phaseIndex, topicIndex, 'in_progress');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${checked ? 'bg-emerald-100 text-emerald-700' : isLearning ? 'bg-sky-100 text-sky-700' : 'bg-white text-sky-700'}`}>
                      {checked ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-semibold leading-6 ${checked ? 'text-slate-600' : 'text-slate-950'}`}>{task.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? 'bg-emerald-100 text-emerald-700' : isLearning ? 'bg-sky-100 text-sky-800' : 'bg-white text-slate-600'}`}>
                          {statusLabel[status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        AILINES AI 会先联网搜索资料，再整合成围绕这一学习点的课程、例题和练习。
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">
                        {actionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white pt-3">
                  <p className="text-xs font-medium text-slate-500">所属阶段：{stage.title}</p>
                  <button
                    type="button"
                    onClick={() => onSetTopicStatus(phaseIndex, topicIndex, checked ? 'not_started' : 'completed')}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 ${
                      checked
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700 focus:ring-sky-100'
                    }`}
                  >
                    {checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {checked ? '取消完成' : '标记完成'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

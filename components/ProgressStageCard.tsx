'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import type { ProgressStage } from '@/lib/mockProgress';

const topicProgressPrefix = 'ailines-progress-topic:';

type ProgressStageCardProps = {
  stage: ProgressStage;
  goal: string;
  mode: 'lite' | 'deep';
  phaseIndex: number;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
};

function createLearnHref(goal: string, mode: 'lite' | 'deep', stage: ProgressStage, phaseIndex: number, topic: string, topicIndex: number) {
  const params = new URLSearchParams({
    goal,
    mode,
    phaseName: stage.title,
    topic,
    phaseIndex: String(phaseIndex + 1),
    topicIndex: String(topicIndex + 1),
  });

  return `/learn?${params.toString()}`;
}

function createTopicStorageKey(goal: string, phaseName: string, topic: string) {
  return `${topicProgressPrefix}${goal}:${phaseName}:${topic}`;
}

export function ProgressStageCard({ stage, goal, mode, phaseIndex, completedTaskIds, onToggleTask }: ProgressStageCardProps) {
  const [learningTopicKeys, setLearningTopicKeys] = useState<string[]>([]);
  const completedInStage = stage.tasks.filter((task) => completedTaskIds.includes(task.id)).length;

  useEffect(() => {
    try {
      const activeKeys = stage.tasks
        .map((task) => createTopicStorageKey(goal, stage.title, task.title))
        .filter((key) => window.localStorage.getItem(key) === 'in_progress');
      setLearningTopicKeys(activeKeys);
    } catch {
      setLearningTopicKeys([]);
    }
  }, [goal, stage]);

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
          const checked = completedTaskIds.includes(task.id);
          const learnHref = createLearnHref(goal, mode, stage, phaseIndex, task.title, topicIndex);
          const topicStorageKey = createTopicStorageKey(goal, stage.title, task.title);
          const isLearning = !checked && learningTopicKeys.includes(topicStorageKey);
          const statusLabel = checked ? '已完成' : isLearning ? '学习中' : '未学习';
          const actionLabel = checked || isLearning ? '继续学习' : '开始学习';

          return (
            <li key={task.id}>
              <div
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/80 hover:shadow-sm"
                data-topic-storage-key={topicStorageKey}
              >
                <Link href={learnHref} className="block focus:outline-none focus:ring-4 focus:ring-sky-100">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${checked ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-sky-700'}`}>
                      {checked ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-semibold leading-6 ${checked ? 'text-slate-500' : 'text-slate-950'}`}>{task.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600'}`}>
                          {statusLabel}
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
                    onClick={() => onToggleTask(task.id)}
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

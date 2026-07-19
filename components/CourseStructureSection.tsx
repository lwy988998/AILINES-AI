import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { createLearnHref, createProgressLookup } from '@/lib/course/courseLearningNavigation';
import type { LearningCardProgressItem } from '@/lib/course/learningCardProgressRepository';
import type { CourseStage } from '@/lib/mockPlan';

type CourseStructureSectionProps = {
  stages: CourseStage[];
  goal?: string;
  mode?: 'lite' | 'deep';
  courseId?: string;
  anonymousId?: string;
  cardProgressItems?: LearningCardProgressItem[];
};

export function CourseStructureSection({ stages, goal, mode = 'deep', courseId, anonymousId, cardProgressItems = [] }: CourseStructureSectionProps) {
  const canLinkToLearn = Boolean(goal);
  const getStatus = createProgressLookup(cardProgressItems);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">课程结构</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">每个学习点都能直接进入微课程</h2>
        </div>
        <p className="text-sm text-slate-500">按顺序学，也可以直接选择卡住的知识点。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {stages.map((stage, phaseIndex) => (
          <article key={stage.stage} className="min-w-0 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="break-words text-lg font-semibold text-slate-950">{stage.stage}</h3>
            <ul className="mt-4 space-y-3">
              {stage.topics.map((topic, topicIndex) => {
                const phaseNo = phaseIndex + 1;
                const topicNo = topicIndex + 1;
                const status = getStatus(phaseNo, topicNo);
                const completed = status === 'completed';
                const inProgress = status === 'in_progress';
                const href = canLinkToLearn
                  ? createLearnHref({ goal: goal!, mode, courseId, anonymousId, phaseIndex: phaseNo, phaseName: stage.stage, topicIndex: topicNo, topic })
                  : '';

                return (
                  <li key={`${topic}-${topicIndex}`} className={`rounded-2xl border p-3 text-sm leading-6 ${completed ? 'border-emerald-100 bg-emerald-50' : inProgress ? 'border-sky-100 bg-sky-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex min-w-0 items-start gap-3">
                      {completed ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : inProgress ? <PlayCircle className="mt-1 h-4 w-4 shrink-0 text-sky-700" /> : <Circle className="mt-1 h-4 w-4 shrink-0 text-slate-400" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <span className="break-words font-medium text-slate-800">{topic}</span>
                          <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${completed ? 'bg-emerald-100 text-emerald-700' : inProgress ? 'bg-sky-100 text-sky-800' : 'bg-white text-slate-500'}`}>
                            {completed ? '已完成' : inProgress ? '学习中' : '未开始'}
                          </span>
                        </div>
                        {canLinkToLearn ? (
                          <Link href={href} className="mt-3 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-sky-800 ring-1 ring-sky-100 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                            {completed ? '复习这一节' : inProgress ? '继续学习' : '开始学习'}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

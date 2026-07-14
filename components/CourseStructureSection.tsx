import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { CourseStage } from '@/lib/mockPlan';

type CourseStructureSectionProps = {
  stages: CourseStage[];
  goal?: string;
  mode?: 'lite' | 'deep';
  courseId?: string;
};

function createLearnHref(input: { goal: string; mode: 'lite' | 'deep'; courseId?: string; phaseIndex: number; phaseName: string; topicIndex: number; topic: string }) {
  const params = new URLSearchParams({
    goal: input.goal,
    mode: input.mode,
    phaseIndex: String(input.phaseIndex),
    phaseName: input.phaseName,
    topicIndex: String(input.topicIndex),
    topic: input.topic,
  });
  if (input.courseId) params.set('courseId', input.courseId);
  return `/learn?${params.toString()}`;
}

export function CourseStructureSection({ stages, goal, mode = 'deep', courseId }: CourseStructureSectionProps) {
  const canLinkToLearn = Boolean(goal);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">课程结构</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">每个阶段都有明确知识点</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {stages.map((stage, phaseIndex) => (
          <article key={stage.stage} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-950">{stage.stage}</h3>
            <ul className="mt-4 space-y-3">
              {stage.topics.map((topic, topicIndex) => {
                const href = canLinkToLearn
                  ? createLearnHref({ goal: goal!, mode, courseId, phaseIndex: phaseIndex + 1, phaseName: stage.stage, topicIndex: topicIndex + 1, topic })
                  : '';
                const content = (
                  <>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                    <span className="min-w-0 flex-1">{topic}</span>
                    {canLinkToLearn ? <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-sky-700 opacity-70" /> : null}
                  </>
                );

                return (
                  <li key={topic} className="text-sm leading-6 text-slate-600">
                    {canLinkToLearn ? (
                      <Link href={href} className="flex gap-3 rounded-xl px-2 py-1 transition hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
                        {content}
                      </Link>
                    ) : (
                      <div className="flex gap-3">{content}</div>
                    )}
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

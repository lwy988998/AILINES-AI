import { CheckCircle2 } from 'lucide-react';
import type { CourseStage } from '@/lib/mockPlan';

type CourseStructureSectionProps = {
  stages: CourseStage[];
};

export function CourseStructureSection({ stages }: CourseStructureSectionProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">课程结构</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">每个阶段都有明确知识点</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {stages.map((stage) => (
          <article key={stage.stage} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-950">{stage.stage}</h3>
            <ul className="mt-4 space-y-3">
              {stage.topics.map((topic) => (
                <li key={topic} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

import { Clock3, Target } from 'lucide-react';
import type { RoadmapStage } from '@/lib/mockPlan';

type RoadmapSectionProps = {
  stages: RoadmapStage[];
};

export function RoadmapSection({ stages }: RoadmapSectionProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">学习路线</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">分阶段推进，不靠临时冲刺</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {stages.map((stage, index) => (
          <article key={stage.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{stage.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                    <Clock3 className="h-3.5 w-3.5 text-sky-700" />
                    {stage.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                    <Target className="h-3.5 w-3.5 text-sky-700" />
                    学习目标
                  </span>
                </div>
                <p className="mt-4 font-medium leading-7 text-slate-800">{stage.goal}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

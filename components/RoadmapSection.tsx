import Link from 'next/link';
import { Clock3, Target } from 'lucide-react';
import type { RoadmapStage } from '@/lib/mockPlan';

type RoadmapSectionProps = {
  goal: string;
  stages: RoadmapStage[];
  mode?: 'lite' | 'deep';
  courseId?: string;
};

export function RoadmapSection({ goal, stages, mode = 'deep', courseId }: RoadmapSectionProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">学习路线</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">分阶段推进，不靠临时冲刺</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {stages.map((stage, index) => {
          const phaseParams = new URLSearchParams({ goal, mode, phaseIndex: `${index + 1}`, phaseName: stage.name });
          if (courseId) {
            phaseParams.set('courseId', courseId);
          }
          const phaseHref = `/phase?${phaseParams.toString()}`;

          return (
            <Link
              key={stage.name}
              href={phaseHref}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-lg hover:shadow-sky-900/10 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              <article>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-semibold text-white transition group-hover:bg-sky-800">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 transition group-hover:text-sky-900">{stage.name}</h3>
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
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stage.description || '暂无说明'}</p>
                    {stage.output ? <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium leading-6 text-slate-700">阶段产出：{stage.output}</p> : null}
                    {stage.checkpoint ? <p className="mt-2 text-sm leading-6 text-slate-600">检查点：{stage.checkpoint}</p> : null}
                    <p className="mt-4 text-sm font-semibold text-sky-700 transition group-hover:text-sky-900">查看阶段详情 →</p>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

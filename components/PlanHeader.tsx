import { Sparkles } from 'lucide-react';

type PlanHeaderProps = {
  goal: string;
  title: string;
  duration: string;
  summary: string;
  modeLabel: string;
  modeDescription: string;
};

export function PlanHeader({ goal, title, duration, summary, modeLabel, modeDescription }: PlanHeaderProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
            <Sparkles className="h-4 w-4" />
            静态学习方案
          </div>
          <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl break-words text-base leading-8 text-slate-600 sm:text-lg">
            {summary}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-sky-800">当前学习目标</p>
          <p className="mt-2 break-words text-xl font-semibold text-slate-950 sm:text-2xl">{goal}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">建议周期：{duration} · 适合从入门到完成作品集</p>
          <div className="mt-4 rounded-xl border border-sky-100 bg-white px-3 py-2">
            <p className="text-xs font-semibold text-sky-700">当前模式：{modeLabel}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{modeDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

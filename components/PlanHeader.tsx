import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

type PlanHeaderProps = {
  goal: string;
};

export function PlanHeader({ goal }: PlanHeaderProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
            <Sparkles className="h-4 w-4" />
            静态学习方案
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {goal} 学习方案
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            正在为你规划：{goal}。这是一份 MVP 阶段的静态路线，帮助你先看清阶段、课程、资源和项目产出。
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-800">当前学习目标</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{goal}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">建议周期：约 10 周 · 适合从入门到完成作品集</p>
        </div>
      </div>
    </section>
  );
}

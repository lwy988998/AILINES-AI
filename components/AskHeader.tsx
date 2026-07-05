import Link from 'next/link';
import { ArrowLeft, ListChecks } from 'lucide-react';

type AskHeaderProps = {
  goal: string;
  title: string;
};

export function AskHeader({ goal, title }: AskHeaderProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/plan?goal=${encodeURIComponent(goal)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回方案页
          </Link>
          <Link
            href={`/progress?goal=${encodeURIComponent(goal)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ListChecks className="h-4 w-4" />
            返回进度页
          </Link>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
          轻量 AI 问答已开启。
        </span>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-sky-700">当前学习目标：{goal}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          遇到安装、注册、环境配置等问题，可以先在这里快速提问。
        </p>
      </div>
    </section>
  );
}

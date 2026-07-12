import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

type ProgressHeaderProps = {
  goal: string;
  mode: 'lite' | 'deep';
  courseId?: string;
  title: string;
};

export function ProgressHeader({ goal, mode, courseId, title }: ProgressHeaderProps) {
  const encodedGoal = encodeURIComponent(goal);
  const encodedMode = encodeURIComponent(mode);
  const planHref = courseId ? `/plan?courseId=${encodeURIComponent(courseId)}` : `/plan?goal=${encodedGoal}&mode=${encodedMode}`;
  const askHref = courseId ? `/ask?goal=${encodedGoal}&mode=${encodedMode}&courseId=${encodeURIComponent(courseId)}` : `/ask?goal=${encodedGoal}&mode=${encodedMode}`;
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={planHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
        >
          <ArrowLeft className="h-4 w-4" />
          返回方案页
        </Link>
        <Link
          href={askHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          <MessageCircle className="h-4 w-4" />
          问 AILINES AI
        </Link>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-sky-700">学习进度追踪</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          每个学习点都可以进入 AILINES AI 课程页：先搜索真实资料，再整合成讲解、例题、练习和完成检查。你仍可以保留完成状态，用来追踪学习进度。
        </p>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

type ProgressPageProps = {
  searchParams: Promise<{
    goal?: string;
  }>;
};

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '你的目标';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-sky-100 bg-white p-6 text-center shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-800">
            <Clock3 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            进度追踪功能开发中：{goal}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            当前 MVP 先提供学习方案展示，后续会补充任务拆解、进度记录和复盘提醒。
          </p>
          <Link
            href={`/plan?goal=${encodeURIComponent(goal)}`}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回学习方案
          </Link>
        </div>
      </section>
    </main>
  );
}

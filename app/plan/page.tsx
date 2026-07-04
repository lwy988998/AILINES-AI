import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '你的目标';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            方案生成中
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            正在为你生成：{goal} 的学习方案
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            这里后续会展示阶段路线、课程结构、资源清单、项目实战和进度追踪。当前页面用于承接首页输入与下一阶段开发。
          </p>

          <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {['分析学习目标', '拆解阶段路线', '整理资源与项目建议'].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-sky-700 shadow-sm">
                  {index + 1}
                </div>
                <div className="h-3 flex-1 rounded-full bg-white">
                  <div className="h-3 rounded-full bg-sky-200" style={{ width: `${36 + index * 22}%` }} />
                </div>
                <span className="w-28 text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}

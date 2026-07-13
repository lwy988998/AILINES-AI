import { SiteHeader } from '@/components/site-header';

export default function PlanLoading() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-700" />
            AILINES AI 生成中
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            正在准备你的学习内容
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            AILINES AI 正在根据你的目标整理适合的学习内容。快速规划会优先给出基础步骤，深度规划会补充完整课程和资料。
          </p>
          <p className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-slate-600">
            通常需要几十秒；如果生成暂时未完成，会先展示一份可执行的基础版本。
          </p>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
              <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

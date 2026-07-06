import Image from 'next/image';
import { GoalForm } from '@/components/goal-form';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <Image
        src="/ailines-wallpaper.jpg"
        alt="AILINES AI 品牌视觉背景"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/68 to-sky-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),rgba(255,255,255,0.08)_44%,rgba(2,6,23,0.22))]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <section className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-2 shadow-xl shadow-sky-950/10 backdrop-blur-xl sm:h-24 sm:w-24">
              <Image
                src="/ailines-wallpaper.jpg"
                alt="AILINES AI Logo"
                width={96}
                height={96}
                priority
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-800">AILINES AI</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">告诉我你想学什么</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              把一个学习目标，转化为阶段路线、真实资料和可执行任务。
            </p>

            <div className="mt-8">
              <GoalForm />
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-600">
              支持课程拆解、阶段任务、真实资料推荐和进度推进。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

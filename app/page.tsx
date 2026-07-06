import Image from 'next/image';
import { GoalForm } from '@/components/goal-form';
import { InteractiveAICards } from '@/components/home/InteractiveAICards';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="bg-white">
      <section className="relative min-h-screen overflow-hidden bg-slate-950">
        <Image
          src="/ailines-wallpaper.jpg"
          alt="AILINES AI 品牌视觉背景"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/78 via-white/64 to-white/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),rgba(255,255,255,0.04)_48%,rgba(2,6,23,0.12))]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader />

          <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">告诉我你想学什么</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                把一个学习目标，转化为阶段路线、真实资料和可执行任务。
              </p>

              <div className="mx-auto mt-9 max-w-4xl">
                <GoalForm />
              </div>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                支持课程拆解、阶段任务、真实资料推荐和进度推进。
              </p>
            </div>
          </div>
        </div>
      </section>

      <InteractiveAICards />
    </main>
  );
}

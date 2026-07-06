import Image from 'next/image';
import { GoalForm } from '@/components/goal-form';
import { InteractiveAICards } from '@/components/home/InteractiveAICards';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="bg-white">
      <section className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.9),rgba(248,251,255,0.98)_42%,rgba(238,246,255,1))]">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-12 pt-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl text-center">
              <div className="mx-auto w-[78vw] max-w-[500px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-2xl shadow-sky-900/10 backdrop-blur-sm sm:p-4">
                <Image
                  src="/ailines-logo-main.png"
                  alt="AILINES AI Logo"
                  width={1200}
                  height={800}
                  priority
                  className="h-auto w-full rounded-[1.4rem] object-contain"
                />
              </div>

              <div className="mx-auto mt-8 max-w-4xl">
                <GoalForm />
              </div>

              <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-6 text-slate-600">
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

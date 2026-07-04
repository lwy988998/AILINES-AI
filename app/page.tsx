import Image from 'next/image';
import { CapabilityGrid } from '@/components/capability-grid';
import { GoalForm } from '@/components/goal-form';
import { SiteHeader } from '@/components/site-header';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-14 lg:pt-12">
        <div className="flex min-h-[560px] flex-col justify-center">
          <p className="mb-4 text-sm font-semibold text-sky-700">AI 学习规划助手</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            输入学习目标，生成学习路线
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            面向普通用户与学生，把“我想学 XXX”转化为阶段路线、课程结构、资源清单和项目实战路径。
          </p>

          <div className="mt-8 max-w-2xl">
            <GoalForm />
          </div>
        </div>

        <div className="flex items-center lg:justify-end">
          <div className="w-full overflow-hidden rounded-3xl border border-sky-100 bg-white p-3 shadow-sm shadow-sky-900/10">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-sky-50">
              <Image
                src="/ailines-wallpaper.jpg"
                alt="AILINES AI 品牌视觉图"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-contain"
              />
            </div>
            <div className="grid gap-3 border-t border-slate-100 px-2 py-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-slate-500">入口</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">目标输入</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">输出</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">学习方案</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">状态</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">MVP 骨架</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CapabilityGrid />
    </main>
  );
}

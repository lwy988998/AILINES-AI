import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { GoalForm } from '@/components/goal-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth/currentUser';

export const metadata: Metadata = {
  title: 'AILINES AI - 把学习目标变成可执行课程',
  description: 'AILINES AI 帮你从学习目标生成课程路线、阶段任务、微课程讲解、练习测验和学习进度，让 AI 规划真正变成可持续学习。',
};

const capabilityNotes = [
  ['课程路线', '把目标拆成阶段和任务'],
  ['微课程', '每个知识点都有讲解、练习和小测'],
  ['进度记录', '下次回到我的课堂继续学习'],
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%,#f8fafc_100%)] text-slate-950">
      <SiteHeader />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-center px-4 pb-10 pt-10 text-center sm:px-6 sm:pt-14 lg:px-8">
        <div className="flex flex-col items-center">
          <Image
            src="/ailines-logo-transparent.png"
            alt="AILINES AI Logo"
            width={1024}
            height={776}
            priority
            className="h-28 w-auto object-contain drop-shadow-sm sm:h-36"
          />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">AILINES AI</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            把学习目标变成可以一步步完成的课程。
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            输入你想学习的内容，AILINES AI 会生成课程路线、学习任务、微课程和进度记录。
          </p>
        </div>

        <div className="mt-7 w-full max-w-4xl">
          <GoalForm />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-600">
          {user ? (
            <Link href="/my-courses" className="rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sky-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300">
              继续我的课堂
            </Link>
          ) : (
            <Link href="/register" className="rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sky-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300">
              注册体验
            </Link>
          )}
          <Link href="/membership" className="rounded-full px-4 py-2 transition hover:bg-white/80 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
            会员能力
          </Link>
        </div>

        <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {capabilityNotes.map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-sky-900/5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-700" />
                {title}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

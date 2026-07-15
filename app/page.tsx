import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, GraduationCap, Layers3, PlayCircle, Search, Sparkles, Target, Trophy } from 'lucide-react';
import { GoalForm } from '@/components/goal-form';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth/currentUser';

export const metadata: Metadata = {
  title: 'AILINES AI - 把学习目标变成可执行课程',
  description: 'AILINES AI 帮你从学习目标生成课程路线、阶段任务、微课程讲解、练习测验和学习进度，让 AI 规划真正变成可持续学习。',
};

const heroBadges = ['AI 课程规划', '真实资料搜索', '微课程学习', '进度保存'];

const capabilities = [
  {
    icon: Target,
    title: 'AI 课程路线',
    description: '输入一个学习目标，自动拆成阶段化课程路线、阶段目标和可执行学习顺序。',
  },
  {
    icon: Layers3,
    title: '阶段任务卡片',
    description: '每个阶段都有任务、资料、学习产出和下一步行动，避免只拿到一张静态计划表。',
  },
  {
    icon: BookOpenCheck,
    title: '微课程学习页',
    description: '每个学习点继续生成讲解、示例、练习和小测，把路线推进成真正能学的课程。',
  },
  {
    icon: Search,
    title: '真实资料搜索',
    description: 'Bocha 优先、Tavily fallback，先整合真实资料，再组织成适合学习的内容。',
  },
  {
    icon: CheckCircle2,
    title: '进度持久化',
    description: '登录后保存课程、阶段状态和学习进度，下次回来可以继续推进。',
  },
  {
    icon: GraduationCap,
    title: '我的课堂',
    description: '已生成课程统一沉淀在「我的课堂」，不用反复从零生成，也方便回顾复习。',
  },
];

const steps = [
  ['01', '输入学习目标', '写下你想提升、入门或完成的目标。'],
  ['02', '生成课程路线', '选择 lite、deep 或 image，让 AI 生成对应路线或图片。'],
  ['03', '进入微课程学习', '从阶段任务深入到讲解、示例、练习和小测。'],
  ['04', '保存进度持续学习', '登录后保存课程和状态，下次从我的课堂继续。'],
];

const scenes = ['考试提分', '编程入门', '职业技能', '兴趣学习', '创意生图', '项目式学习'];

const membershipPlans = [
  {
    name: 'Free',
    description: '适合轻量体验',
    points: ['体验 AI 学习路线生成', '基础课程总览', '课程与进度保存'],
  },
  {
    name: 'Pro',
    description: '适合系统学习',
    points: ['更适合系统化课程学习', '深度规划能力', '微课程与学习辅助能力'],
    featured: true,
  },
  {
    name: 'Max',
    description: '适合高强度深度学习',
    points: ['适合高频使用', '更高额度能力', '后续高级能力优先接入'],
  },
];

const trustNotes = [
  'AILINES AI 会尽量结合真实资料，而不是只凭空生成计划。',
  '搜索失败时会使用 fallback，不影响课程生成主流程。',
  '课程和进度会在登录后保存，可从「我的课堂」继续学习。',
  '生图服务如果 provider 不稳定，会显示友好 fallback。',
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-950">
      <section id="top" className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(125,211,252,0.32),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(99,102,241,0.22),transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef7ff_54%,#ffffff_100%)]">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute -left-28 top-28 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-28 top-72 h-80 w-80 rounded-full bg-indigo-300/18 blur-3xl" />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />

          <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:py-14">
            <div className="min-w-0 text-center lg:text-left">
              <div className="mx-auto mb-4 flex items-center justify-center gap-3 lg:mx-0 lg:justify-start">
                <Image
                  src="/ailines-logo-transparent.png"
                  alt="AILINES AI Logo"
                  width={1024}
                  height={776}
                  priority
                  className="h-14 w-auto object-contain drop-shadow-sm sm:h-16"
                />
                <span className="text-lg font-semibold tracking-tight text-sky-950 sm:text-xl">AILINES AI</span>
              </div>

              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {heroBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-sky-200/80 bg-white/75 px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm shadow-sky-900/5 backdrop-blur">
                    {badge}
                  </span>
                ))}
              </div>

              <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:mx-0 lg:leading-[1.08]">
                让 AI 把你的目标变成一门真正能学的课程
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
                输入你想学习的目标，AILINES AI 会为你生成课程路线、阶段任务、微课程讲解、练习测验和继续学习进度。
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a href="#generate" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
                  立即生成课程
                  <ArrowRight className="h-4 w-4" />
                </a>
                {user ? (
                  <Link href="/my-courses" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200 bg-white/80 px-5 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                    查看我的课堂
                  </Link>
                ) : (
                  <Link href="/membership" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200 bg-white/80 px-5 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                    了解会员
                  </Link>
                )}
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/55 p-4 text-left shadow-sm shadow-sky-900/5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-700 text-white">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">课程化学习系统</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">从总览、阶段、学习点到进度保存，不只停在一份计划。</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="generate" className="min-w-0 scroll-mt-24 rounded-[2rem] border border-white/80 bg-white/50 p-3 shadow-2xl shadow-sky-950/15 backdrop-blur-xl sm:p-4">
              <GoalForm />
            </div>
          </div>
        </div>
      </section>

      <section id="learn-more" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-sky-700">不只是学习计划</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">AILINES AI 是课程化学习系统</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">它把目标拆成路线，把路线推进成阶段任务，再把任务延展成可学习、可练习、可继续的微课程。</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-sky-50/55 p-6 shadow-sm shadow-sky-900/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-sm shadow-sky-900/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-sky-700">学习流程</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">从想学，到真的开始学</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">普通 AI 规划工具往往停在“给你一份计划”。AILINES AI 继续向下生成课程内容、任务和进度，让学习能持续推进。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
                <span className="text-sm font-bold text-sky-700">{number}</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,#ffffff,#f0f9ff)] p-6 shadow-sm shadow-sky-900/5 sm:p-8">
              <p className="text-sm font-semibold text-sky-700">适用场景</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">学习、考试、项目和创意都能从目标开始</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {scenes.map((scene) => (
                  <span key={scene} className="rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm">
                    {scene}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/20 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-200">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-200">课程卡片预览</p>
                  <h3 className="text-xl font-semibold">Python 零基础入门</h3>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {['阶段 1：环境搭建与语法基础', '微课程：变量、分支、循环与函数', '练习测验：做一个命令行计算器'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                    <PlayCircle className="h-4 w-4 shrink-0 text-sky-200" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-sky-50 to-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-sky-700">Free / Pro / Max</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">按学习强度选择会员能力</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">这里只展示会员能力差异，不提供支付、不模拟开通，也不会让普通用户直接修改会员等级。</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {membershipPlans.map((plan) => (
              <article key={plan.name} className={`rounded-3xl border bg-white p-6 shadow-sm shadow-sky-900/5 ${plan.featured ? 'border-sky-400 ring-4 ring-sky-100' : 'border-sky-100'}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-slate-950">{plan.name}</h3>
                  {plan.featured ? <span className="rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white">推荐</span> : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-sky-800">{plan.description}</p>
                <ul className="mt-5 space-y-3">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href={user ? '/membership' : '/register'} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200">
              {user ? '查看会员' : '注册体验'}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-sky-700">信任与说明</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">真实资料优先，失败也要优雅 fallback</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">AILINES AI 会尽量把外部资料、课程结构和进度管理整合在一起，让 AI 规划真正变成持续学习。</p>
          </div>
          <div className="grid gap-3">
            {trustNotes.map((note) => (
              <div key={note} className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">AILINES AI</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">把你的学习目标，变成可执行的 AI 课程。</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
            {user ? <Link href="/my-courses" className="hover:text-white">我的课堂</Link> : null}
            <Link href="/membership" className="hover:text-white">会员</Link>
            <a href="#top" className="hover:text-white">返回顶部</a>
            <a href="#generate" className="hover:text-white">开始生成</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

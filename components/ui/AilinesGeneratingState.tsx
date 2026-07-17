'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

export type AilinesGeneratingType = 'plan' | 'lite-plan' | 'deep-plan' | 'restore' | 'phase' | 'learn' | 'image' | 'progress' | 'search' | 'generic';

type AilinesGeneratingStateProps = {
  type?: AilinesGeneratingType;
  title?: string;
  subtitle?: string;
  steps?: string[];
  showSkeleton?: boolean;
  compact?: boolean;
  estimatedSeconds?: number;
  className?: string;
};

const presets: Record<AilinesGeneratingType, { title: string; subtitle: string; steps: string[]; hint: string }> = {
  generic: {
    title: 'AILINES AI 正在准备内容',
    subtitle: '我们正在理解你的需求，并把信息整理成可继续学习的结构。',
    steps: ['理解你的需求', '拆解核心目标', '整理上下文', '生成内容结构', '准备展示结果'],
    hint: '内容准备完成后会自动进入结果页。',
  },
  plan: {
    title: '正在生成你的课程总览',
    subtitle: 'AILINES AI 正在整合学习目标、真实资料和课程结构，生成可持续学习的课堂。',
    steps: ['正在读取学习目标', '正在整合真实搜索资料', '正在构建课程大纲', '正在生成思维导图与课件', '正在保存课程快照'],
    hint: '我们会优先整理可用资料，并为你生成清晰的课程结构。',
  },
  'lite-plan': {
    title: 'AILINES AI 正在快速规划你的学习路线',
    subtitle: '我们正在提炼关键知识模块，优先生成轻量、可立即执行的学习路线。',
    steps: ['正在理解你的学习目标', '正在识别核心知识模块', '正在生成轻量学习路线', '正在整理阶段任务', '正在准备结果页面'],
    hint: '快速规划会优先给出清晰路径，减少等待时间。',
  },
  'deep-plan': {
    title: 'AILINES AI 正在深度设计你的课程',
    subtitle: '我们正在搜索资料、筛选资源、设计课程结构，并准备保存你的课堂。',
    steps: ['正在理解你的学习目标与当前水平', '正在搜索真实学习资料', '正在筛选高质量参考资源', '正在设计课程结构与阶段目标', '正在生成课件、任务与学习路径', '正在保存你的课堂'],
    hint: '深度规划会整合更多资料和学习步骤，生成更完整的课程。',
  },
  restore: {
    title: '正在恢复你的课堂',
    subtitle: 'AILINES AI 正在读取已保存的课堂内容和学习进度，不会重新生成课程。',
    steps: ['正在读取课程记录', '正在恢复课程快照', '正在加载学习进度', '正在准备继续学习入口'],
    hint: '正在恢复你保存过的课程内容。',
  },
  phase: {
    title: '正在生成阶段课程',
    subtitle: 'AILINES AI 正在围绕当前阶段整理知识点、参考资料和任务卡片。',
    steps: ['正在分析当前阶段目标', '正在整理关键知识点', '正在整合参考资料', '正在生成任务卡片', '正在准备阶段课件'],
    hint: '我们会把阶段重点整理成可直接学习的任务和资料。',
  },
  learn: {
    title: '正在准备这节课',
    subtitle: 'AILINES AI 正在把当前学习点整理成讲解、示例、练习和总结。',
    steps: ['正在读取学习点', '正在组织讲解结构', '正在生成示例与练习', '正在整理课程总结', '正在更新学习状态'],
    hint: '如果这节课之前生成过，会优先恢复已保存的学习内容。',
  },
  image: {
    title: 'AILINES AI 正在生成图像',
    subtitle: '我们正在理解画面需求、优化提示词，并调用图像模型准备结果。',
    steps: ['正在理解你的画面需求', '正在优化图像提示词', '正在生成画面细节', '正在处理生成结果', '正在准备展示图片'],
    hint: '图片生成完成后会在页面中展示，你也可以重新生成。',
  },
  progress: {
    title: '正在加载学习进度',
    subtitle: 'AILINES AI 正在恢复学习卡片、计算完成状态并准备继续学习入口。',
    steps: ['正在读取课程任务', '正在恢复学习卡片', '正在计算完成进度', '正在准备继续学习入口'],
    hint: '进度加载完成后，你可以直接进入下一张学习卡片。',
  },
  search: {
    title: '正在搜索并整合资料',
    subtitle: 'AILINES AI 正在查找真实资料，并将资料吸收进课程内容。',
    steps: ['查询网络资料', '筛选可用资源', '提炼核心内容', '生成学习说明'],
    hint: '我们会先整理可用内容，帮助你继续学习。',
  },
};

export function AilinesGeneratingState({
  type = 'generic',
  title,
  subtitle,
  steps,
  showSkeleton = true,
  compact = false,
  estimatedSeconds = 18,
  className = '',
}: AilinesGeneratingStateProps) {
  const preset = presets[type];
  const visibleSteps = useMemo(() => (steps?.length ? steps : preset.steps), [preset.steps, steps]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    setActiveIndex(0);
    setProgress(12);

    const stepMs = Math.max(900, Math.round((estimatedSeconds * 1000) / Math.max(visibleSteps.length + 1, 2)));
    const stepTimer = window.setInterval(() => {
      setActiveIndex((current) => Math.min(current + 1, visibleSteps.length - 1));
    }, stepMs);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return current;
        const next = current + Math.max(1, Math.round((94 - current) * 0.08));
        return Math.min(94, next);
      });
    }, 650);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
    };
  }, [estimatedSeconds, visibleSteps.length]);

  return (
    <section className={`relative max-w-full overflow-hidden rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.8))]" />
      <div className="pointer-events-none absolute left-[-20%] top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent ailines-shimmer" />

      <div className={`relative grid min-w-0 gap-5 sm:gap-7 ${compact || !showSkeleton ? '' : 'lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch'}`}>
        <div className="min-w-0 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm shadow-sky-900/5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-700" />
            </span>
            AILINES AI 工作流
          </div>

          <div>
            <h1 className={`${compact ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-4xl lg:text-5xl'} break-words font-semibold tracking-tight text-slate-950`}>{title || preset.title}</h1>
            <p className="mt-4 max-w-3xl break-words text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">{subtitle || preset.subtitle}</p>
          </div>

          <div className="max-w-full overflow-hidden rounded-2xl border border-sky-100 bg-white/75 shadow-sm shadow-sky-900/5">
            <div className="h-2 overflow-hidden bg-sky-50">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-300 via-sky-600 to-cyan-300 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <ol className="grid gap-0 divide-y divide-sky-50 p-2 sm:grid-cols-2 sm:divide-y-0">
              {visibleSteps.map((step, index) => {
                const done = index < activeIndex;
                const active = index === activeIndex;
                return (
                  <li key={`${step}-${index}`} className={`flex min-w-0 items-start gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-sky-50 text-sky-950' : done ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${done ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : active ? 'bg-sky-700 text-white ring-sky-200' : 'bg-white text-slate-400 ring-slate-200'}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : active ? index + 1 : <Circle className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`${active ? 'font-semibold ' : ''}min-w-0 break-words`}>{step}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="break-words rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-slate-600">{preset.hint}</p>
        </div>

        {showSkeleton ? (
          <div className={`grid min-w-0 gap-4 sm:grid-cols-2 ${compact ? '' : 'lg:grid-cols-1'}`}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm shadow-sky-900/5 backdrop-blur ailines-soft-float" style={{ animationDelay: `${item * 120}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-3/5 rounded-full bg-slate-100 ailines-skeleton" />
                    <div className="h-2.5 w-2/5 rounded-full bg-slate-100 ailines-skeleton" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="h-3 w-full rounded-full bg-slate-100 ailines-skeleton" />
                  <div className="h-3 w-11/12 rounded-full bg-slate-100 ailines-skeleton" />
                  <div className="h-3 w-2/3 rounded-full bg-slate-100 ailines-skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const AILoading = AilinesGeneratingState;

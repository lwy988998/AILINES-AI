import { Sparkles } from 'lucide-react';

export type AilinesGeneratingType = 'plan' | 'lite-plan' | 'deep-plan' | 'learn' | 'image' | 'search' | 'generic';

type AilinesGeneratingStateProps = {
  type?: AilinesGeneratingType;
  title?: string;
  subtitle?: string;
  steps?: string[];
};

const presets: Record<AilinesGeneratingType, { title: string; subtitle: string; steps: string[]; hint: string }> = {
  generic: {
    title: '正在准备你的学习内容',
    subtitle: 'AILINES AI 正在根据你的目标整理学习路径。',
    steps: ['理解你的需求', '拆解学习目标', '搜索真实资料', '整理课程内容', '生成学习卡片'],
    hint: '如果生成较慢，会先展示可学习的基础版本。',
  },
  plan: {
    title: '正在准备你的学习内容',
    subtitle: 'AILINES AI 正在根据你的目标整理学习路径。',
    steps: ['理解你的需求', '拆解学习目标', '搜索真实资料', '整理课程内容', '生成学习卡片'],
    hint: '如果深度生成较慢，会先展示可学习的基础版本。',
  },
  'lite-plan': {
    title: '正在生成快速规划',
    subtitle: 'AILINES AI 正在提炼关键步骤，优先给你可立即执行的轻量学习方案。',
    steps: ['理解学习目标', '提取核心步骤', '整理练习建议', '准备基础资料'],
    hint: '快速规划会优先输出能马上行动的步骤，再补充少量资料。',
  },
  'deep-plan': {
    title: '正在生成深度课程',
    subtitle: 'AILINES AI 正在规划阶段课程、课件、知识结构和真实资料。',
    steps: ['理解学习目标', '拆解阶段路线', '搜索真实学习资料', '整合课程课件', '生成思维导图', '准备阶段任务'],
    hint: '深度课程需要更完整的结构整理，稍慢时会先给出可学习的基础版本。',
  },
  learn: {
    title: '正在生成本节学习内容',
    subtitle: 'AILINES AI 正在结合当前主题和资料，整理成可学习的分步课程。',
    steps: ['理解当前学习点', '搜索相关资料', '整理关键概念', '生成例题和练习', '准备完成检查'],
    hint: '如果资料搜索较慢，会先展示基础讲解和练习。',
  },
  image: {
    title: '正在生成图片',
    subtitle: 'AILINES AI 正在根据你的描述生成视觉内容。',
    steps: ['理解画面需求', '优化图像提示词', '调用生图模型', '接收生成结果'],
    hint: '若当前模型暂不可用，会自动尝试备用 provider，并给出友好提示。',
  },
  search: {
    title: '正在搜索并整合资料',
    subtitle: 'AILINES AI 正在查找真实资料，并把资料整理成课程内容。',
    steps: ['查询网络资料', '筛选可用资源', '提炼核心内容', '生成学习说明'],
    hint: '搜索失败时不会中断学习流程，会先提供基础内容。',
  },
};

export function AilinesGeneratingState({ type = 'generic', title, subtitle, steps }: AilinesGeneratingStateProps) {
  const preset = presets[type];
  const visibleSteps = steps?.length ? steps : preset.steps;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,249,255,0.78))]" />
      <div className="pointer-events-none absolute left-[-20%] top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent ailines-shimmer" />

      <div className="relative grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm shadow-sky-900/5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-700" />
            </span>
            AILINES AI 正在生成
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{title || preset.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{subtitle || preset.subtitle}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white/75 shadow-sm shadow-sky-900/5">
            <div className="h-1.5 overflow-hidden bg-sky-50">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-300 via-sky-600 to-cyan-300 ailines-progress" />
            </div>
            <ol className="grid gap-0 divide-y divide-sky-50 p-2 sm:grid-cols-2 sm:divide-y-0">
              {visibleSteps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-800 ring-1 ring-sky-100">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-slate-600">{preset.hint}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm shadow-sky-900/5 backdrop-blur ailines-soft-float" style={{ animationDelay: `${item * 120}ms` }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
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
      </div>
    </section>
  );
}

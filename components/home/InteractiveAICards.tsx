const aiCards = [
  {
    title: '目标理解',
    description: '识别你的学习需求、当前阶段和期望产出。',
    href: '#feature-goal-understanding',
  },
  {
    title: '路线拆解',
    description: '把目标拆成阶段路线、学习任务和阶段成果。',
    href: '#feature-route-breakdown',
  },
  {
    title: '网页搜索整合',
    description: '结合真实网页搜索，为每个阶段整理可打开的学习资料。',
    href: '#feature-web-search',
  },
  {
    title: '进度推进',
    description: '通过任务状态、完成度和阶段成果推动持续学习。',
    href: '#feature-progress-tracking',
  },
];

const featureDetails = [
  {
    id: 'feature-goal-understanding',
    title: '目标理解',
    description: 'AILINES AI 会根据用户输入的学习需求，识别学习领域、目标难度、阶段重点和最终产出。',
    items: ['提取学习关键词', '判断学习领域', '明确学习目标', '形成阶段化输入'],
  },
  {
    id: 'feature-route-breakdown',
    title: '路线拆解',
    description: 'AILINES AI 会把一个模糊目标拆成多个阶段，每个阶段包含学习任务、预计耗时和阶段产出。',
    items: ['阶段目标', '学习任务', '时间建议', '阶段成果'],
  },
  {
    id: 'feature-web-search',
    title: '网页搜索整合',
    description: 'AILINES AI 不只生成静态内容，还会结合真实网页搜索资源，为学习路线和阶段详情补充真实可打开的资料，而不是只生成静态文本。',
    items: ['聚合真实网页资源', '为不同学习阶段匹配相关资料', '推荐教程、文档、课程、项目和练习', 'Bocha 优先，Tavily fallback', '搜索失败时自动使用基础推荐，页面不崩溃'],
  },
  {
    id: 'feature-progress-tracking',
    title: '进度推进',
    description: 'AILINES AI 会把阶段任务变成可执行卡片，支持未开始、进行中、已完成等状态，帮助用户持续推进。',
    items: ['阶段任务卡片', '状态切换', '完成度进度条', '本地进度记录', '阶段成果沉淀'],
  },
];

export function InteractiveAICards() {
  return (
    <section className="bg-gradient-to-b from-white to-sky-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-sky-700">AILINES AI 学习闭环</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">AILINES AI 如何帮你生成学习路线</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            从目标输入到阶段任务、网页搜索资料整合和进度推进，形成完整学习闭环。
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {aiCards.map((card, index) => (
            <a
              key={card.title}
              href={card.href}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md hover:shadow-sky-900/10 focus:outline-none focus:ring-4 focus:ring-sky-100 active:translate-y-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 transition group-hover:bg-sky-700 group-hover:text-white">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              <p className="mt-4 text-xs font-semibold text-sky-700">了解更多 →</p>
            </a>
          ))}
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {featureDetails.map((feature) => (
            <section
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5"
            >
              <p className="text-sm font-semibold text-sky-700">功能详情</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{feature.description}</p>
              <ul className="mt-5 grid gap-2 text-sm font-medium text-slate-700 sm:grid-cols-2">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 rounded-2xl bg-sky-50 px-3 py-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

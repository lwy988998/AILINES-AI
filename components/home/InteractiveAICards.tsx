'use client';

import { useState } from 'react';

const aiCards = [
  {
    title: '目标理解',
    description: 'AI 会识别你的学习目标、当前阶段和期望产出。',
    items: ['提取关键词', '判断学习领域', '明确最终成果'],
  },
  {
    title: '路线拆解',
    description: '把目标拆成多个阶段，每个阶段都有任务和产出。',
    items: ['阶段目标', '学习任务', '时间建议'],
  },
  {
    title: '真实资料推荐',
    description: '结合搜索资源，为每个阶段推荐真实可打开的学习资料。',
    items: ['教程', '文档', '项目', '练习资源'],
  },
  {
    title: '进度推进',
    description: '通过任务卡片、状态记录和阶段完成度推动学习。',
    items: ['未开始', '进行中', '已完成', '本地进度记录'],
  },
];

export function InteractiveAICards() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gradient-to-b from-white to-sky-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-sky-700">AI 学习闭环</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">AI 如何帮你生成学习路线</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            从目标输入到阶段任务、真实资料和进度推进，形成完整学习闭环。
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {aiCards.map((card, index) => {
            const isOpen = openIndex === index;

            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                  isOpen ? 'border-sky-300 bg-sky-50 shadow-sky-900/10' : 'border-slate-200 bg-white shadow-slate-900/5'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${isOpen ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                <div className={`grid transition-all duration-200 ${isOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <ul className="space-y-2 border-t border-sky-100 pt-4 text-sm font-medium text-slate-700">
                      {card.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-sky-700">{isOpen ? '点击收起' : '点击展开'}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

'use client';

import { CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: '免费版',
    price: '¥0',
    description: '适合初次体验 AILINES AI 学习规划',
    benefits: ['每日 1 条基础学习路线', '每日 5 次轻量问答', '可保存 1 条路线', '查看基础资源推荐'],
    buttonLabel: '当前方案',
    featured: false,
    disabled: true,
  },
  {
    name: 'AILINES 会员',
    price: '¥29/月',
    description: '适合持续学习和多路线规划',
    benefits: ['无限生成学习路线', '无限轻量问答', '完整资源清单', '完整项目实战路径', '进度追踪与学习提醒', '优先体验新功能'],
    buttonLabel: '开通会员',
    featured: true,
    disabled: false,
  },
  {
    name: '精品路线包',
    price: '¥39/条',
    description: '适合针对单一领域深度学习',
    benefits: ['单领域深度路线', '完整课程结构', '项目实战指导', '验收 checklist', '可长期查看'],
    buttonLabel: '购买路线包',
    featured: false,
    disabled: false,
  },
];

export function PricingCards() {
  function showPaymentPlaceholder() {
    alert('支付功能将在后续任务中接入');
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={`relative rounded-3xl border bg-white p-6 shadow-sm shadow-sky-900/5 ${
            plan.featured ? 'border-sky-400 ring-4 ring-sky-100' : 'border-sky-100'
          }`}
        >
          {plan.featured ? (
            <span className="absolute right-5 top-5 rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white">推荐</span>
          ) : null}
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{plan.name}</h2>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{plan.price}</p>
          <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
          <ul className="mt-6 space-y-3">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={plan.disabled}
            onClick={showPaymentPlaceholder}
            className={`mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus:outline-none focus:ring-4 ${
              plan.disabled
                ? 'cursor-not-allowed bg-slate-100 text-slate-500'
                : plan.featured
                  ? 'bg-sky-700 text-white hover:bg-sky-800 focus:ring-sky-200'
                  : 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus:ring-sky-100'
            }`}
          >
            {plan.buttonLabel}
          </button>
        </article>
      ))}
    </section>
  );
}

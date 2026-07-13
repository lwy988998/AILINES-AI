'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getMembershipLimits, getMembershipLabel, type MembershipTier } from '@/lib/membership/tiers';

const planOrder: MembershipTier[] = ['free', 'pro', 'max'];

const planCopy: Record<MembershipTier, { name: string; description: string; featured: boolean }> = {
  free: {
    name: 'Free',
    description: '适合体验 AILINES AI 学习规划和基础学习流程。',
    featured: false,
  },
  pro: {
    name: 'Pro',
    description: '适合持续学习、多课程管理和更高频使用。',
    featured: true,
  },
  max: {
    name: 'Max',
    description: '适合高频学习、团队试用和后续高级能力。',
    featured: false,
  },
};

export function PricingCards({ currentTier = 'free', isLoggedIn = false }: { currentTier?: MembershipTier; isLoggedIn?: boolean }) {
  const [pendingTier, setPendingTier] = useState<MembershipTier | null>(null);
  const [message, setMessage] = useState('');

  async function simulateTier(tier: MembershipTier) {
    if (!isLoggedIn) return;
    setPendingTier(tier);
    setMessage('');

    try {
      const response = await fetch('/api/membership/simulate-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };

      if (!response.ok) {
        setMessage(data.error || '模拟开通失败，请稍后重试。');
        return;
      }

      setMessage(`已模拟开通 ${getMembershipLabel(tier)}，正在刷新权益。`);
      window.location.reload();
    } catch {
      setMessage('模拟开通失败，请检查网络后重试。');
    } finally {
      setPendingTier(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">测试功能：模拟开通会员</p>
        <p className="mt-1">当前为测试阶段，会员为模拟开通，暂未接入支付，不会生成订单，也不会收集付款信息。</p>
        {message ? <p className="mt-2 font-semibold text-amber-800">{message}</p> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {planOrder.map((tier) => {
          const plan = planCopy[tier];
          const limits = getMembershipLimits(tier);
          const isCurrent = tier === currentTier;
          const isPending = pendingTier === tier;
          const benefits = [
            `每日课程生成 ${limits.courseGeneratePerDay} 次`,
            `每日学习卡片生成 ${limits.learnGeneratePerDay} 次`,
            `每日生图 ${limits.imageGeneratePerDay} 次`,
            '历史课堂和课程进度保存',
            limits.allowCourseSlides ? '课程课件和思维导图' : '基础课程总览',
            tier === 'max' ? '所有功能开放，后续高级能力优先接入' : tier === 'pro' ? '浮动 AILINES AI 助手和深度规划' : '基础搜索资料和 Free 权限',
          ];

          return (
            <article
              key={tier}
              className={`relative rounded-3xl border bg-white p-6 shadow-sm shadow-sky-900/5 ${
                plan.featured ? 'border-sky-400 ring-4 ring-sky-100' : 'border-sky-100'
              }`}
            >
              {plan.featured ? (
                <span className="absolute right-5 top-5 rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white">推荐</span>
              ) : null}
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{plan.name}</h2>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{getMembershipLabel(tier)}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  type="button"
                  disabled
                  className="mt-7 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white"
                >
                  当前方案
                </button>
              ) : isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => simulateTier(tier)}
                  disabled={Boolean(pendingTier)}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  模拟开通 {getMembershipLabel(tier)}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
                >
                  登录后模拟开通
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

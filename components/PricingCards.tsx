import { CheckCircle2 } from 'lucide-react';
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
    description: '适合高频学习、团队协作和更高额度需求。',
    featured: false,
  },
};

export function PricingCards({ currentTier = 'free' }: { currentTier?: MembershipTier; isLoggedIn?: boolean }) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900">
        <p className="font-semibold">会员开通说明</p>
        <p className="mt-1">如需开通 Pro 或 Max，请联系管理员。当前页面展示 Free / Pro / Max 的权益与额度。</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {planOrder.map((tier) => {
          const plan = planCopy[tier];
          const limits = getMembershipLimits(tier);
          const isCurrent = tier === currentTier;
          const benefits = [
            `每日课程生成 ${limits.courseGeneratePerDay} 次`,
            `每日学习卡片生成 ${limits.learnGeneratePerDay} 次`,
            `每日生图 ${limits.imageGeneratePerDay} 次`,
            '历史课堂和课程进度保存',
            limits.allowCourseSlides ? '课程课件和思维导图' : '课程总览',
            tier === 'max' ? '更高额度和完整学习能力' : tier === 'pro' ? '浮动 AILINES AI 助手和深度规划' : '搜索资料和 Free 权益',
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
              <button
                type="button"
                disabled
                className={`mt-7 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl px-5 text-sm font-semibold ${
                  isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isCurrent ? '当前方案' : '联系管理员开通'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

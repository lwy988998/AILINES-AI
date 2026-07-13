import { getMembershipLabel, type MembershipTier } from '@/lib/membership/tiers';

export function MembershipHero({ tier = 'free' }: { tier?: MembershipTier }) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <p className="text-sm font-semibold text-sky-700">会员分层 MVP</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">会员方案</h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
        Free / Pro / Max 三档额度体系已接入。第一阶段只做权限和额度提示，不接支付、不做订单。
      </p>
      <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium leading-6 text-sky-900">
        当前方案：<span className="font-bold">{getMembershipLabel(tier)}</span>。Pro / Max 开通入口即将开放。
      </p>
    </section>
  );
}

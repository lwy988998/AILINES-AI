import Link from 'next/link';
import { LockKeyhole, Sparkles } from 'lucide-react';
import type { MembershipFeature } from '@/lib/membership/permissions';
import { getUpgradeMessage } from '@/lib/membership/permissions';
import { getMembershipLabel, type MembershipTier } from '@/lib/membership/tiers';

type UpgradeRequiredCardProps = {
  feature: MembershipFeature;
  title?: string;
  description?: string;
  requiredTier?: MembershipTier;
  goal?: string;
  showLiteLink?: boolean;
  compact?: boolean;
};

export function UpgradeRequiredCard({ feature, title = '需要升级会员', description, requiredTier = 'pro', goal, showLiteLink = false, compact = false }: UpgradeRequiredCardProps) {
  const message = description || getUpgradeMessage(feature, requiredTier);
  const liteHref = `/plan?${new URLSearchParams({ goal: goal || '你的目标', mode: 'lite' }).toString()}`;

  return (
    <section className={`rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50 to-sky-50 shadow-sm shadow-sky-900/5 ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-700">{getMembershipLabel(requiredTier)} 功能</p>
            <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold tracking-tight text-slate-950`}>{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          <Link href="/membership" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            <Sparkles className="h-4 w-4" />
            查看会员方案
          </Link>
          {showLiteLink ? (
            <Link href={liteHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
              改用快速规划
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function LockedFeatureCard({ feature, title, requiredTier = 'pro' }: { feature: MembershipFeature; title: string; requiredTier?: MembershipTier }) {
  return <UpgradeRequiredCard feature={feature} title={title} requiredTier={requiredTier} compact />;
}

import { prisma } from '@/lib/db/prisma';
import { getMembershipLabel, getUsageLimitForType, normalizeMembershipTier, type MembershipTier, type UsageType } from '@/lib/membership/tiers';

export type UsageScope = {
  scopeId: string;
  scopeType: 'user' | 'anonymous';
};

export function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getUsageScope({ userId, anonymousId }: { userId?: string | null; anonymousId?: string | null }): UsageScope | null {
  const safeUserId = userId?.trim();
  if (safeUserId) return { scopeId: safeUserId, scopeType: 'user' };
  const safeAnonymousId = anonymousId?.trim();
  if (safeAnonymousId) return { scopeId: safeAnonymousId, scopeType: 'anonymous' };
  return null;
}

export async function getUsage(type: UsageType, scope: UsageScope | null, dateKey = getDateKey()) {
  if (!scope) return 0;
  try {
    const counter = await prisma.usageCounter.findUnique({
      where: { scopeId_scopeType_type_dateKey: { ...scope, type, dateKey } },
      select: { count: true },
    });
    return counter?.count || 0;
  } catch (error) {
    console.warn('get usage failed', error instanceof Error ? error.message : 'unknown');
    return 0;
  }
}

export async function incrementUsage(type: UsageType, scope: UsageScope | null, dateKey = getDateKey()) {
  if (!scope) return 0;
  try {
    const counter = await prisma.usageCounter.upsert({
      where: { scopeId_scopeType_type_dateKey: { ...scope, type, dateKey } },
      create: { ...scope, type, dateKey, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return counter.count;
  } catch (error) {
    console.warn('increment usage failed', error instanceof Error ? error.message : 'unknown');
    return 0;
  }
}

export async function checkUsageLimit(input: { userId?: string | null; anonymousId?: string | null; tier?: string | null; type: UsageType }) {
  const tier = normalizeMembershipTier(input.tier);
  const limit = getUsageLimitForType(tier, input.type);
  const scope = getUsageScope(input);

  if (!scope) {
    return { allowed: true, limit, used: 0, remaining: limit, tier, label: getMembershipLabel(tier), scope: null };
  }

  const used = await getUsage(input.type, scope);
  return {
    allowed: used < limit,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    tier,
    label: getMembershipLabel(tier),
    scope,
  };
}

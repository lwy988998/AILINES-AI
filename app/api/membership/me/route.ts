import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { getMembershipLabel, getMembershipLimits, normalizeMembershipTier, type UsageType } from '@/lib/membership/tiers';
import { checkUsageLimit } from '@/lib/membership/usage';

const USAGE_TYPES: UsageType[] = ['course_generate', 'learn_generate', 'image_generate', 'assistant_chat'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    const anonymousId = request.nextUrl.searchParams.get('anonymousId')?.trim() || undefined;
    const tier = normalizeMembershipTier(user?.membershipTier);
    const usageEntries = await Promise.all(
      USAGE_TYPES.map(async (type) => {
        const usage = await checkUsageLimit({ userId: user?.id, anonymousId, tier, type });
        return [type, { used: usage.used, limit: usage.limit, remaining: usage.remaining }] as const;
      }),
    );

    return NextResponse.json({
      tier,
      label: getMembershipLabel(tier),
      status: user?.membershipStatus || 'active',
      membershipStartedAt: user?.membershipStartedAt || null,
      membershipExpiresAt: user?.membershipExpiresAt || null,
      limits: getMembershipLimits(tier),
      usage: Object.fromEntries(usageEntries),
    });
  } catch (error) {
    console.warn('membership me failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({
      tier: 'free',
      label: 'Free',
      status: 'active',
      limits: getMembershipLimits('free'),
      usage: {},
    });
  }
}

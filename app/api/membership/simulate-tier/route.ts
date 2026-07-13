import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { prisma } from '@/lib/db/prisma';
import { normalizeMembershipTier } from '@/lib/membership/tiers';

export const dynamic = 'force-dynamic';

function isSimulationEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.MEMBERSHIP_SIMULATION_ENABLED === 'true';
}

export async function POST(request: NextRequest) {
  if (!isSimulationEnabled()) {
    return NextResponse.json({ error: '模拟开通功能未启用。' }, { status: 403 });
  }

  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录后再模拟开通会员。' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { tier?: unknown };
  const rawTier = typeof body.tier === 'string' ? body.tier.trim().toLowerCase() : '';

  if (rawTier !== 'free' && rawTier !== 'pro' && rawTier !== 'max') {
    return NextResponse.json({ error: 'tier must be one of: free, pro, max.' }, { status: 400 });
  }

  const tier = normalizeMembershipTier(rawTier);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      membershipTier: tier,
      membershipStatus: 'active',
      membershipStartedAt: new Date(),
      membershipExpiresAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
      membershipStatus: true,
    },
  }).catch(() => null);

  if (!updatedUser) {
    return NextResponse.json({ error: '无法更新会员等级，请稍后重试。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: updatedUser });
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

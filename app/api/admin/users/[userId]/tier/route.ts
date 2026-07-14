import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminFromRequest } from '@/lib/admin';
import { normalizeMembershipTier } from '@/lib/membership/tiers';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.user ? 'Forbidden' : 'Unauthorized' }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({})) as { tier?: unknown };
  const rawTier = typeof body.tier === 'string' ? body.tier.trim().toLowerCase() : '';
  if (rawTier !== 'free' && rawTier !== 'pro' && rawTier !== 'max') {
    return NextResponse.json({ error: 'tier must be one of: free, pro, max.' }, { status: 400 });
  }

  const { userId } = await params;
  const tier = normalizeMembershipTier(rawTier);
  const now = new Date();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      membershipTier: tier,
      membershipStatus: 'active',
      membershipStartedAt: now,
      membershipExpiresAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
      membershipStatus: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true } },
    },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: normalizeMembershipTier(user.membershipTier),
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastActiveAt: user.updatedAt.toISOString(),
      courseCount: user._count.courses,
    },
  });
}

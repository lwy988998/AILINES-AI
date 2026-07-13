import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { normalizeMembershipTier } from '@/lib/membership/tiers';

export const dynamic = 'force-dynamic';

function getAdminToken() {
  return process.env.MEMBERSHIP_ADMIN_TOKEN?.trim() || '';
}

export async function POST(request: NextRequest) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: 'Membership admin API is disabled.' }, { status: 404 });
  }

  const providedToken = request.headers.get('x-membership-admin-token')?.trim() || '';
  if (!providedToken || providedToken !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { email?: unknown; tier?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawTier = typeof body.tier === 'string' ? body.tier.trim().toLowerCase() : '';
  const tier = normalizeMembershipTier(rawTier);

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  if (rawTier !== 'free' && rawTier !== 'pro' && rawTier !== 'max') {
    return NextResponse.json({ error: 'tier must be one of: free, pro, max.' }, { status: 400 });
  }

  const now = new Date();
  const user = await prisma.user.update({
    where: { email },
    data: {
      membershipTier: tier,
      membershipStatus: 'active',
      membershipStartedAt: tier === 'free' ? null : now,
      membershipExpiresAt: tier === 'free' ? null : undefined,
    },
    select: {
      id: true,
      email: true,
      membershipTier: true,
      membershipStatus: true,
      membershipStartedAt: true,
      membershipExpiresAt: true,
    },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      membershipStartedAt: user.membershipStartedAt?.toISOString() || null,
      membershipExpiresAt: user.membershipExpiresAt?.toISOString() || null,
    },
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

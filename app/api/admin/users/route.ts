import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAdminFromRequest } from '@/lib/admin';
import { normalizeMembershipTier } from '@/lib/membership/tiers';

export const dynamic = 'force-dynamic';

function boundedPageSize(value: string | null) {
  const parsed = Number(value || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.user ? 'Forbidden' : 'Unauthorized' }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const rawTier = (searchParams.get('tier') || '').trim().toLowerCase();
  const tier = rawTier === 'free' || rawTier === 'pro' || rawTier === 'max' ? normalizeMembershipTier(rawTier) : null;
  const pageSize = boundedPageSize(searchParams.get('pageSize'));
  const page = Math.max(Number(searchParams.get('page') || 1) || 1, 1);

  const where: Prisma.UserWhereInput = {
    ...(q ? { email: { contains: q } } : {}),
    ...(tier ? { membershipTier: tier } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: normalizeMembershipTier(user.membershipTier),
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastActiveAt: user.updatedAt.toISOString(),
      courseCount: user._count.courses,
    })),
    page,
    pageSize,
    total,
  });
}

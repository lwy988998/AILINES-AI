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
    return NextResponse.json({ error: '当前无法处理该请求，请稍后重试。' }, { status: 404 });
  }

  const providedToken = request.headers.get('x-membership-admin-token')?.trim() || '';
  if (!providedToken || providedToken !== adminToken) {
    return NextResponse.json({ error: '请先登录或确认你有权限操作。' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { email?: unknown; tier?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawTier = typeof body.tier === 'string' ? body.tier.trim().toLowerCase() : '';
  const tier = normalizeMembershipTier(rawTier);

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '请输入有效邮箱。' }, { status: 400 });
  }

  if (rawTier !== 'free' && rawTier !== 'pro' && rawTier !== 'max') {
    return NextResponse.json({ error: '会员等级参数不正确。' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  }).catch(() => null);

  if (!existingUser) {
    return NextResponse.json({ error: '未找到该用户。' }, { status: 404 });
  }

  const now = new Date();
  const user = await prisma.user.update({
    where: { email },
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
    },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ error: '会员信息更新失败，请稍后重试。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function GET() {
  return NextResponse.json({ error: '请求方式不支持。' }, { status: 405 });
}

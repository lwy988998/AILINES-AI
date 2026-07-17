import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminFromRequest } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.user ? '你没有访问管理员后台的权限。' : '请先登录管理员账号。' }, { status: auth.status });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalUsers, freeUsers, proUsers, maxUsers, totalCourses, recentCourses, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { membershipTier: 'free' } }),
    prisma.user.count({ where: { membershipTier: 'pro' } }),
    prisma.user.count({ where: { membershipTier: 'max' } }),
    prisma.course.count(),
    prisma.course.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      freeUsers,
      proUsers,
      maxUsers,
      totalCourses,
      recentUsers,
      recentCourses,
    },
  });
}

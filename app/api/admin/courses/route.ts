import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminFromRequest } from '@/lib/admin';

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
  const pageSize = boundedPageSize(searchParams.get('pageSize'));

  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: 'desc' },
    take: pageSize,
    select: {
      id: true,
      title: true,
      goal: true,
      mode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { email: true } },
    },
  });

  return NextResponse.json({
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title,
      goal: course.goal,
      mode: course.mode,
      status: course.status,
      ownerEmail: course.user?.email || null,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      planUrl: `/plan?courseId=${encodeURIComponent(course.id)}`,
    })),
  });
}

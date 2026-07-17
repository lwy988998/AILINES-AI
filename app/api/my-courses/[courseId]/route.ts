import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const safeCourseId = courseId?.trim();
  if (!safeCourseId) return NextResponse.json({ error: '课程参数不完整。' }, { status: 400 });

  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: '请先登录后操作。' }, { status: 401 });

    const deleted = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({
        where: { id: safeCourseId, userId: user.id, status: 'active' },
        select: { id: true },
      });

      if (!course) return false;

      await tx.course.delete({ where: { id: course.id } });
      return true;
    });

    if (!deleted) return NextResponse.json({ error: '课程不存在，或你没有访问此内容的权限。' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('delete my course failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: '课程删除失败，请稍后重试。' }, { status: 500 });
  }
}

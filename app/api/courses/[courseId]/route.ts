import { NextRequest, NextResponse } from 'next/server';
import { deleteCourseForRequester, getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const anonymousId = request.nextUrl.searchParams.get('anonymousId')?.trim() || undefined;

  try {
    const user = await getCurrentUserFromRequest(request);
    const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
    const snapshot = course?.snapshots[0];
    if (!course || !snapshot) {
      return NextResponse.json({ error: '历史课堂不存在或已失效' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        id: course.id,
        anonymousId: course.anonymousId,
        goal: course.goal,
        mode: course.mode,
        title: course.title,
        summary: course.summary,
        source: course.source,
        updatedAt: course.updatedAt.toISOString(),
      },
      snapshot: {
        id: snapshot.id,
        courseId: snapshot.courseId,
        version: snapshot.version,
        payload: snapshot.payload,
        createdAt: snapshot.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: '课程历史暂时不可用' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const anonymousId = request.nextUrl.searchParams.get('anonymousId')?.trim() || undefined;

  try {
    const user = await getCurrentUserFromRequest(request);
    const deleted = await deleteCourseForRequester({ courseId, anonymousId, userId: user?.id });
    if (!deleted) {
      return NextResponse.json({ error: '历史课堂不存在或已失效' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '课程删除失败，请稍后重试' }, { status: 500 });
  }
}

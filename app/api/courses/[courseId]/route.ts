import { NextRequest, NextResponse } from 'next/server';
import { deleteCourse, getCourseWithLatestSnapshot } from '@/lib/course/courseRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const anonymousId = request.nextUrl.searchParams.get('anonymousId')?.trim();

  try {
    const result = await getCourseWithLatestSnapshot(courseId);
    if (!result) {
      return NextResponse.json({ error: '历史课堂不存在或已失效' }, { status: 404 });
    }

    if (anonymousId && result.course.anonymousId && result.course.anonymousId !== anonymousId) {
      return NextResponse.json({ error: '历史课堂不存在或已失效' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        id: result.course.id,
        anonymousId: result.course.anonymousId,
        goal: result.course.goal,
        mode: result.course.mode,
        title: result.course.title,
        summary: result.course.summary,
        source: result.course.source,
        updatedAt: result.course.updatedAt.toISOString(),
      },
      snapshot: {
        id: result.snapshot.id,
        courseId: result.snapshot.courseId,
        version: result.snapshot.version,
        payload: result.snapshot.payload,
        createdAt: result.snapshot.createdAt.toISOString(),
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
    const deleted = await deleteCourse(courseId, anonymousId);
    if (!deleted) {
      return NextResponse.json({ error: '历史课堂不存在或已失效' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '课程删除失败，请稍后重试' }, { status: 500 });
  }
}

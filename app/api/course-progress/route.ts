import { NextRequest, NextResponse } from 'next/server';
import { createEmptyCourseProgress, getCourseProgress, recomputeCourseProgress, updateLastVisited } from '@/lib/course/courseProgressRepository';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function serializeProgress(progress: ReturnType<typeof createEmptyCourseProgress>) {
  return {
    courseId: progress.courseId,
    overallPercent: progress.overallPercent,
    completedCount: progress.completedCount,
    totalCount: progress.totalCount,
    lastVisitedUrl: progress.lastVisitedUrl,
    lastPageType: progress.lastPageType,
    lastPhaseIndex: progress.lastPhaseIndex,
    lastPhaseName: progress.lastPhaseName,
    lastTopicIndex: progress.lastTopicIndex,
    lastTopicTitle: progress.lastTopicTitle,
    updatedAt: progress.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
  if (!courseId) return NextResponse.json({ error: 'courseId 缺失' }, { status: 400 });

  try {
    const progress = await getCourseProgress(courseId);
    return NextResponse.json({ progress: serializeProgress(progress || createEmptyCourseProgress(courseId)) });
  } catch {
    return NextResponse.json({ progress: serializeProgress(createEmptyCourseProgress(courseId)), error: '课程总进度暂时不可用' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const action = optionalString(data.action);
  const courseId = optionalString(data.courseId);
  if (!courseId) return NextResponse.json({ error: 'courseId 缺失' }, { status: 400 });

  try {
    if (action === 'recompute') {
      const progress = await recomputeCourseProgress({ courseId, anonymousId: optionalString(data.anonymousId) });
      return NextResponse.json({ ok: true, progress: serializeProgress(progress || createEmptyCourseProgress(courseId)) });
    }

    if (action === 'lastVisited') {
      const goal = optionalString(data.goal);
      const lastVisitedUrl = optionalString(data.lastVisitedUrl);
      const lastPageType = optionalString(data.lastPageType);
      if (!goal || !lastVisitedUrl || !lastPageType) {
        return NextResponse.json({ error: '课程访问位置参数不完整' }, { status: 400 });
      }

      const progress = await updateLastVisited({
        courseId,
        anonymousId: optionalString(data.anonymousId),
        goal,
        mode: optionalString(data.mode),
        lastVisitedUrl,
        lastPageType,
        lastPhaseIndex: parseOptionalInt(data.lastPhaseIndex),
        lastPhaseName: optionalString(data.lastPhaseName),
        lastTopicIndex: parseOptionalInt(data.lastTopicIndex),
        lastTopicTitle: optionalString(data.lastTopicTitle),
      });
      return NextResponse.json({ ok: true, progress: serializeProgress(progress || createEmptyCourseProgress(courseId)) });
    }

    return NextResponse.json({ error: 'action 不支持' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '课程总进度保存失败，请稍后重试' }, { status: 500 });
  }
}

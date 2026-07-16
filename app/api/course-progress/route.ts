import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
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
  const anonymousId = request.nextUrl.searchParams.get('anonymousId')?.trim() || undefined;
  if (!courseId) return NextResponse.json({ error: 'courseId 缺失' }, { status: 400 });

  try {
    const user = await getCurrentUserFromRequest(request);
    const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
    if (!course) return NextResponse.json({ error: '无权查看这个课程的学习进度' }, { status: 403 });

    const progress = await getCourseProgress(courseId);
    return NextResponse.json({ progress: serializeProgress(progress || createEmptyCourseProgress(courseId)) });
  } catch {
    return NextResponse.json({ progress: serializeProgress(createEmptyCourseProgress(courseId)), error: '课程总进度加载失败，请稍后重试' }, { status: 200 });
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
    const anonymousId = optionalString(data.anonymousId);
    const user = await getCurrentUserFromRequest(request);
    const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
    if (!course) return NextResponse.json({ error: '无权修改这个课程的学习进度' }, { status: 403 });
    const ownedAnonymousId = course.anonymousId || anonymousId;

    if (action === 'recompute') {
      const progress = await recomputeCourseProgress({ courseId, anonymousId: ownedAnonymousId });
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
        anonymousId: ownedAnonymousId,
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

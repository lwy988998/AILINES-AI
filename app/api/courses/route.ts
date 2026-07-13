import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateCourseSnapshot, listCoursesForUserOrAnonymous } from '@/lib/course/courseRepository';
import type { CourseHistoryMode } from '@/lib/courseHistory';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

function normalizeMode(value: unknown): CourseHistoryMode {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function parseIntegerParam(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serializeProgress(progress?: {
  overallPercent: number;
  completedCount: number;
  totalCount: number;
  lastVisitedUrl: string | null;
  lastPageType: string | null;
  lastPhaseName: string | null;
  lastTopicTitle: string | null;
} | null) {
  return progress ? {
    overallPercent: progress.overallPercent,
    completedCount: progress.completedCount,
    totalCount: progress.totalCount,
    lastVisitedUrl: progress.lastVisitedUrl,
    lastPageType: progress.lastPageType,
    lastPhaseName: progress.lastPhaseName,
    lastTopicTitle: progress.lastTopicTitle,
  } : {
    overallPercent: 0,
    completedCount: 0,
    totalCount: 0,
    lastVisitedUrl: null,
    lastPageType: null,
    lastPhaseName: null,
    lastTopicTitle: null,
  };
}

export async function GET(request: NextRequest) {
  const anonymousId = request.nextUrl.searchParams.get('anonymousId') || undefined;
  const limit = parseIntegerParam(request.nextUrl.searchParams.get('limit'), 50);
  const offset = parseIntegerParam(request.nextUrl.searchParams.get('offset'), 0);

  try {
    const user = await getCurrentUserFromRequest(request);
    const courses = await listCoursesForUserOrAnonymous({ anonymousId, userId: user?.id, limit, offset });
    return NextResponse.json({
      courses: courses.map((course) => ({
        id: course.id,
        goal: course.goal,
        mode: course.mode,
        title: course.title,
        summary: course.summary,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        href: `/plan?courseId=${encodeURIComponent(course.id)}`,
        progress: serializeProgress(course.progress),
      })),
    });
  } catch {
    return NextResponse.json({ courses: [], error: '课程历史暂时不可用' }, { status: 200 });
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
  const goal = typeof data.goal === 'string' ? data.goal.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const summary = typeof data.summary === 'string' ? data.summary.trim() : undefined;
  const source = typeof data.source === 'string' ? data.source.trim() : undefined;
  const anonymousId = typeof data.anonymousId === 'string' ? data.anonymousId.trim() : undefined;
  const userId = typeof data.userId === 'string' ? data.userId.trim() : undefined;
  const payload = data.payload;

  if (!goal || !title || !payload) {
    return NextResponse.json({ error: '课程信息不完整' }, { status: 400 });
  }

  try {
    const user = await getCurrentUserFromRequest(request);
    const { courseId } = await createOrUpdateCourseSnapshot({
      anonymousId,
      userId: user?.id || userId,
      goal,
      mode: normalizeMode(data.mode),
      title,
      summary,
      source,
      payload,
    });
    return NextResponse.json({ courseId, href: `/plan?courseId=${encodeURIComponent(courseId)}` });
  } catch {
    return NextResponse.json({ error: '课程保存失败，请稍后重试' }, { status: 500 });
  }
}

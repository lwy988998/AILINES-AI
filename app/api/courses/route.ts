import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateCourseSnapshot, listCoursesForUserOrAnonymous } from '@/lib/course/courseRepository';
import type { CourseHistoryMode } from '@/lib/courseHistory';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { validateUserVisibleCourseContent } from '@/lib/courseContentQuality';

function normalizeMode(value: unknown): CourseHistoryMode {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function parseIntegerParam(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const COURSE_SAVE_TIMEOUT_MS = 12_000;

async function withSaveTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('course_save_timeout')), COURSE_SAVE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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
        href: user?.id || !anonymousId
          ? `/plan?courseId=${encodeURIComponent(course.id)}`
          : `/plan?courseId=${encodeURIComponent(course.id)}&anonymousId=${encodeURIComponent(anonymousId)}`,
        progress: serializeProgress(course.progress),
      })),
    });
  } catch {
    return NextResponse.json({ courses: [], error: '课程加载失败，请稍后重试。' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确。' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const goal = typeof data.goal === 'string' ? data.goal.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const summary = typeof data.summary === 'string' ? data.summary.trim() : undefined;
  const source = typeof data.source === 'string' ? data.source.trim() : undefined;
  const anonymousId = typeof data.anonymousId === 'string' ? data.anonymousId.trim() : undefined;
  const payload = data.payload;

  if (!goal || !title || !payload) {
    return NextResponse.json({ ok: false, error: 'COURSE_SAVE_INVALID_INPUT', message: '课程信息不完整。', canRetry: true }, { status: 400 });
  }

  const validation = validateUserVisibleCourseContent(payload, { goal, mode: normalizeMode(data.mode), courseTitle: title });
  if (!validation.valid) {
    console.warn('Course snapshot save rejected by quality gate', { fatalReasons: validation.fatalReasons, moduleReasons: validation.moduleReasons, warnings: validation.warnings, fieldPaths: validation.fieldPaths.slice(0, 12), score: validation.score, source: validation.source });
    return NextResponse.json({ ok: false, error: 'COURSE_SNAPSHOT_INVALID', message: '课程内容暂未生成完成，请重新生成后再保存。', canRetry: true }, { status: 422 });
  }

  try {
    const user = await getCurrentUserFromRequest(request);
    const { courseId } = await withSaveTimeout(createOrUpdateCourseSnapshot({
      anonymousId,
      userId: user?.id,
      goal,
      mode: normalizeMode(data.mode),
      title,
      summary,
      source,
      payload,
    }));
    return NextResponse.json({ ok: true, courseId, href: `/plan?courseId=${encodeURIComponent(courseId)}` });
  } catch (error) {
    const code = error instanceof Error && error.message === 'course_save_timeout' ? 'COURSE_SAVE_TIMEOUT' : 'COURSE_SAVE_FAILED';
    console.warn('Course snapshot save unavailable', { error: code });
    return NextResponse.json({ ok: false, error: code, message: '课程保存失败，但你可以重新生成或稍后重试。', canRetry: true }, { status: code === 'COURSE_SAVE_TIMEOUT' ? 504 : 500 });
  }
}

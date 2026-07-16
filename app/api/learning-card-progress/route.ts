import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { recomputeCourseProgress } from '@/lib/course/courseProgressRepository';
import { listLearningCardProgress, normalizeLearningCardStatus, upsertLearningCardProgress } from '@/lib/course/learningCardProgressRepository';

function parsePositiveInt(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest) {
  const goal = request.nextUrl.searchParams.get('goal')?.trim() || '';
  if (!goal) return NextResponse.json({ error: '学习卡片进度参数不完整' }, { status: 400 });

  try {
    const courseId = request.nextUrl.searchParams.get('courseId') || undefined;
    const anonymousId = request.nextUrl.searchParams.get('anonymousId') || undefined;
    if (courseId) {
      const user = await getCurrentUserFromRequest(request);
      const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
      if (!course) return NextResponse.json({ error: '无权查看这个课程的学习进度' }, { status: 403 });
    }

    const items = await listLearningCardProgress({
      courseId,
      anonymousId,
      goal,
      mode: request.nextUrl.searchParams.get('mode') || undefined,
      phaseIndex: parsePositiveInt(request.nextUrl.searchParams.get('phaseIndex')),
      phaseName: request.nextUrl.searchParams.get('phaseName') || undefined,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: '学习卡片进度加载失败，请稍后重试' }, { status: 200 });
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
  const goal = optionalString(data.goal) || '';
  const phaseIndex = parseNonNegativeInt(data.phaseIndex);
  const topicIndex = parseNonNegativeInt(data.topicIndex);
  const topicTitle = optionalString(data.topicTitle) || '';

  if (!goal || phaseIndex === null || phaseIndex < 1 || topicIndex === null || !topicTitle) {
    return NextResponse.json({ error: '学习卡片进度参数不完整' }, { status: 400 });
  }

  try {
    const courseId = optionalString(data.courseId);
    let anonymousId = optionalString(data.anonymousId);
    if (courseId) {
      const user = await getCurrentUserFromRequest(request);
      const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
      if (!course) return NextResponse.json({ error: '无权修改这个课程的学习进度' }, { status: 403 });
      anonymousId = course.anonymousId || anonymousId;
    }

    const item = await upsertLearningCardProgress({
      courseId,
      anonymousId,
      goal,
      mode: optionalString(data.mode),
      phaseIndex,
      phaseName: optionalString(data.phaseName) || `阶段${phaseIndex}`,
      topicIndex,
      topicTitle,
      status: normalizeLearningCardStatus(data.status),
    });
    if (courseId) {
      recomputeCourseProgress({ courseId, anonymousId }).catch((error) => {
        console.warn('course progress recompute after learning card failed', error instanceof Error ? error.message : 'unknown');
      });
    }
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: '学习卡片进度保存失败，请稍后重试' }, { status: 500 });
  }
}

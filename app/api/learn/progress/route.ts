import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { recomputeCourseProgress, updateLastVisited } from '@/lib/course/courseProgressRepository';
import { normalizeLearningCardStatus, upsertLearningCardProgress } from '@/lib/course/learningCardProgressRepository';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseNonNegativeInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function serializeProgress(progress: Awaited<ReturnType<typeof recomputeCourseProgress>>) {
  if (!progress) return null;
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

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确。' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const courseId = optionalString(data.courseId);
  const anonymousId = optionalString(data.anonymousId);
  const goal = optionalString(data.goal) || '';
  const phaseIndex = parseNonNegativeInt(data.phaseIndex);
  const topicIndex = parseNonNegativeInt(data.topicIndex);
  const phaseName = optionalString(data.phaseName) || '';
  const topicTitle = optionalString(data.topicTitle) || '';
  const status = normalizeLearningCardStatus(data.status);
  const lastVisitedUrl = optionalString(data.lastVisitedUrl);

  if (!goal || phaseIndex === null || phaseIndex < 1 || topicIndex === null || !phaseName || !topicTitle) {
    return NextResponse.json({ error: '学习进度参数不完整。' }, { status: 400 });
  }

  try {
    const user = await getCurrentUserFromRequest(request);
    let ownedAnonymousId = anonymousId;

    if (courseId) {
      const course = await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id });
      if (!course) return NextResponse.json({ error: '你没有访问此内容的权限。' }, { status: 403 });
      ownedAnonymousId = course.anonymousId || anonymousId;
    } else if (!anonymousId) {
      return NextResponse.json({ error: '学习进度参数不完整。' }, { status: 400 });
    }

    const item = await upsertLearningCardProgress({
      courseId,
      anonymousId: ownedAnonymousId,
      goal,
      mode: optionalString(data.mode),
      phaseIndex,
      phaseName,
      topicIndex,
      topicTitle,
      status,
    });

    let progress: Awaited<ReturnType<typeof recomputeCourseProgress>> = null;
    if (courseId) {
      if (lastVisitedUrl) {
        await updateLastVisited({
          courseId,
          anonymousId: ownedAnonymousId,
          goal,
          mode: optionalString(data.mode),
          lastVisitedUrl,
          lastPageType: 'learn',
          lastPhaseIndex: phaseIndex,
          lastPhaseName: phaseName,
          lastTopicIndex: topicIndex + 1,
          lastTopicTitle: topicTitle,
        });
      }
      progress = await recomputeCourseProgress({ courseId, anonymousId: ownedAnonymousId });
    }

    return NextResponse.json({ ok: true, item, progress: serializeProgress(progress), progressPercent: progress?.overallPercent ?? null });
  } catch (error) {
    console.warn('learn progress save failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: '学习进度保存失败，请稍后重试。' }, { status: 500 });
  }
}

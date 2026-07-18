import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { buildUnavailableCourseContentNotice, normalizeCoursePlanContent, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { markCourseContentSource, type CourseContentSource } from '@/lib/courseContentSource';
import type { MockPlan } from '@/lib/mockPlan';

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeRelativeUrl(value?: string | null) {
  if (!value || !value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sourceForStoredCourse(source?: string | null): CourseContentSource {
  if (source === 'fallback' || source === 'domain-fallback') return 'domain-fallback';
  if (source === 'template' || source === 'mock') return 'template';
  if (source === 'invalid') return 'invalid';
  return 'legacy-ai';
}

function getValidSnapshotPlan(payload: unknown, goal: string, mode: string, source?: string | null): MockPlan | null {
  const plan = asRecord(payload);
  if (!Array.isArray(plan.roadmap) || !Array.isArray(plan.courseStructure)) return null;
  const normalizedPlan = normalizeCoursePlanContent(markCourseContentSource(plan as MockPlan, sourceForStoredCourse(source)), goal);
  const validation = validateUserVisibleCourseContent(normalizedPlan, { goal, mode: mode === 'lite' ? 'lite' : 'deep', courseTitle: normalizedPlan.title });
  return validation.valid ? normalizedPlan : null;
}

function countLearningCards(payload: unknown) {
  const plan = asRecord(payload);
  const courseStructure = safeArray(plan.courseStructure);
  const fromStructure = courseStructure.reduce<number>((count, phase) => count + safeArray(asRecord(phase).topics).length, 0);
  if (fromStructure > 0) return fromStructure;

  const roadmap = safeArray(plan.roadmap);
  return roadmap.reduce<number>((count, phase) => {
    const record = asRecord(phase);
    const candidates = [record.topics, record.learningCards, record.cards, record.tasks];
    const array = candidates.find((item) => Array.isArray(item));
    return count + safeArray(array).length;
  }, 0);
}

function createLearnUrl(input: {
  courseId: string;
  goal: string;
  mode: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topicTitle: string;
}) {
  const params = new URLSearchParams({
    courseId: input.courseId,
    goal: input.goal,
    mode: input.mode === 'lite' ? 'lite' : 'deep',
    phaseIndex: String(input.phaseIndex),
    phaseName: input.phaseName,
    topicIndex: String(input.topicIndex),
    topic: input.topicTitle,
  });
  return `/learn?${params.toString()}`;
}

function maxIsoDate(...values: Array<Date | null | undefined>) {
  const times = values.filter(Boolean).map((value) => value!.getTime()).filter(Number.isFinite);
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: '请先登录后查看我的课堂。' }, { status: 401 });

    const courses = await prisma.course.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        goal: true,
        mode: true,
        title: true,
        summary: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { payload: true },
        },
        courseProgress: {
          select: {
            overallPercent: true,
            completedCount: true,
            totalCount: true,
            lastVisitedUrl: true,
            lastPageType: true,
            lastPhaseIndex: true,
            lastPhaseName: true,
            lastTopicIndex: true,
            lastTopicTitle: true,
            updatedAt: true,
          },
        },
        learningSessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            phaseIndex: true,
            phaseName: true,
            topicIndex: true,
            topicTitle: true,
            updatedAt: true,
          },
        },
      },
    });

    const courseIds = courses.map((course) => course.id);
    const completedCardRows = courseIds.length > 0
      ? await prisma.learningCardProgress.groupBy({
          by: ['courseId'],
          where: { courseId: { in: courseIds }, status: 'completed' },
          _count: { _all: true },
        })
      : [];
    const completedCardsByCourseId = new Map(completedCardRows.map((row) => [row.courseId || '', row._count._all]));

    return NextResponse.json({
      courses: courses.map((course) => {
        const snapshotPayload = course.snapshots[0]?.payload;
        const validSnapshotPlan = getValidSnapshotPlan(snapshotPayload, course.goal, course.mode, course.source);
        const totalCardsFromSnapshot = validSnapshotPlan ? countLearningCards(validSnapshotPlan) : 0;
        const completedCards = completedCardsByCourseId.get(course.id) || 0;
        const totalCards = totalCardsFromSnapshot || course.courseProgress?.totalCount || 0;
        const progressPercent = course.courseProgress
          ? clampPercent(course.courseProgress.overallPercent)
          : totalCards > 0
            ? clampPercent((completedCards / totalCards) * 100)
            : 0;
        const latestSession = course.learningSessions[0] || null;
        const planUrl = `/plan?courseId=${encodeURIComponent(course.id)}`;
        const sessionUrl = latestSession ? createLearnUrl({
          courseId: course.id,
          goal: course.goal,
          mode: course.mode,
          phaseIndex: latestSession.phaseIndex,
          phaseName: latestSession.phaseName,
          topicIndex: latestSession.topicIndex,
          topicTitle: latestSession.topicTitle,
        }) : null;
        const continueUrl = sessionUrl || safeRelativeUrl(course.courseProgress?.lastVisitedUrl) || planUrl;
        const lastStudiedAt = maxIsoDate(latestSession?.updatedAt, course.courseProgress?.updatedAt, course.updatedAt);
        const status = progressPercent >= 100
          ? 'completed'
          : progressPercent > 0 || Boolean(latestSession) || Boolean(course.courseProgress?.lastVisitedUrl)
            ? 'learning'
            : 'not_started';

        return {
          id: course.id,
          title: validSnapshotPlan?.title || course.title || course.goal,
          goal: course.goal,
          summary: validSnapshotPlan?.summary || buildUnavailableCourseContentNotice('这门课程摘要'),
          mode: course.mode,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          lastStudiedAt,
          progressPercent,
          completedCards,
          totalCards,
          status,
          continueUrl,
          planUrl,
        };
      }),
    });
  } catch (error) {
    console.warn('load my courses failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: '课程加载失败，请刷新后重试。' }, { status: 500 });
  }
}

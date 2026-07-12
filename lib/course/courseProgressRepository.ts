import { prisma } from '@/lib/db/prisma';

type CourseProgressInput = {
  courseId: string;
  anonymousId?: string;
};

type LastVisitedInput = CourseProgressInput & {
  goal: string;
  mode?: string;
  lastVisitedUrl: string;
  lastPageType: string;
  lastPhaseIndex?: number;
  lastPhaseName?: string;
  lastTopicIndex?: number;
  lastTopicTitle?: string;
};

export type CourseProgressSummary = {
  courseId: string;
  overallPercent: number;
  completedCount: number;
  totalCount: number;
  lastVisitedUrl: string | null;
  lastPageType: string | null;
  lastPhaseIndex: number | null;
  lastPhaseName: string | null;
  lastTopicIndex: number | null;
  lastTopicTitle: string | null;
  updatedAt: Date;
};

export class CourseProgressRepositoryError extends Error {
  constructor(message = '课程总进度暂时不可用') {
    super(message);
    this.name = 'CourseProgressRepositoryError';
  }
}

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toSummary(row: {
  courseId: string;
  overallPercent: number;
  completedCount: number;
  totalCount: number;
  lastVisitedUrl: string | null;
  lastPageType: string | null;
  lastPhaseIndex: number | null;
  lastPhaseName: string | null;
  lastTopicIndex: number | null;
  lastTopicTitle: string | null;
  updatedAt: Date;
}): CourseProgressSummary {
  return {
    courseId: row.courseId,
    overallPercent: clampPercent(row.overallPercent),
    completedCount: Math.max(0, row.completedCount || 0),
    totalCount: Math.max(0, row.totalCount || 0),
    lastVisitedUrl: row.lastVisitedUrl,
    lastPageType: row.lastPageType,
    lastPhaseIndex: row.lastPhaseIndex,
    lastPhaseName: row.lastPhaseName,
    lastTopicIndex: row.lastTopicIndex,
    lastTopicTitle: row.lastTopicTitle,
    updatedAt: row.updatedAt,
  };
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function estimateTotals(payload: unknown) {
  const plan = asRecord(payload);
  const roadmap = safeArray(plan.roadmap);
  const courseStructure = safeArray(plan.courseStructure);

  const tasksTotal = roadmap.reduce<number>((count, stage) => {
    const record = asRecord(stage);
    const candidates = [record.tasks, record.checklist, record.practices, record.projects];
    const array = candidates.find((item) => Array.isArray(item));
    return count + safeArray(array).length;
  }, 0);

  const stepsTotal = roadmap.reduce<number>((count, stage) => count + safeArray(asRecord(stage).steps).length, 0);

  const cardTotalFromStructure = courseStructure.reduce<number>((count, stage) => count + safeArray(asRecord(stage).topics).length, 0);
  const cardTotalFromRoadmap = roadmap.reduce<number>((count, stage) => {
    const record = asRecord(stage);
    const candidates = [record.topics, record.learningCards, record.cards];
    const array = candidates.find((item) => Array.isArray(item));
    return count + safeArray(array).length;
  }, 0);
  const cardsTotal = cardTotalFromStructure || cardTotalFromRoadmap;

  return {
    tasksTotal,
    stepsTotal,
    cardsTotal,
    totalCount: tasksTotal + stepsTotal + cardsTotal,
  };
}

async function countCompletedByCourse(courseId: string) {
  const [completedTasks, understoodSteps, completedCards] = await Promise.all([
    prisma.taskProgress.count({ where: { courseId, status: 'completed' } }),
    prisma.learningStepProgress.count({ where: { courseId, status: 'understood' } }),
    prisma.learningCardProgress.count({ where: { courseId, status: 'completed' } }),
  ]);
  return { completedTasks, understoodSteps, completedCards, completedCount: completedTasks + understoodSteps + completedCards };
}

export async function getCourseProgress(courseId: string): Promise<CourseProgressSummary | null> {
  const safeCourseId = normalizeOptionalString(courseId);
  if (!safeCourseId) throw new CourseProgressRepositoryError('courseId 缺失');

  try {
    const row = await prisma.courseProgress.findUnique({
      where: { courseId: safeCourseId },
      select: {
        courseId: true,
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
    });
    return row ? toSummary(row) : null;
  } catch (error) {
    console.warn('get course progress failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseProgressRepositoryError();
  }
}

export async function recomputeCourseProgress(input: CourseProgressInput): Promise<CourseProgressSummary | null> {
  const courseId = normalizeOptionalString(input.courseId);
  if (!courseId) throw new CourseProgressRepositoryError('courseId 缺失');

  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, status: 'active' },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!course) return null;

    const payload = course.snapshots[0]?.payload;
    const totals = estimateTotals(payload);
    const counts = await countCompletedByCourse(courseId);
    const completedCount = counts.completedCount;
    const totalCount = totals.totalCount;
    const overallPercent = totalCount > 0 ? clampPercent((completedCount / totalCount) * 100) : 0;
    const anonymousId = normalizeOptionalString(input.anonymousId) || course.anonymousId || undefined;

    const row = await prisma.courseProgress.upsert({
      where: { courseId },
      create: {
        courseId,
        anonymousId,
        userId: course.userId || undefined,
        goal: course.goal,
        mode: course.mode,
        overallPercent,
        completedCount,
        totalCount,
      },
      update: {
        anonymousId,
        userId: course.userId || undefined,
        goal: course.goal,
        mode: course.mode,
        overallPercent,
        completedCount,
        totalCount,
      },
      select: {
        courseId: true,
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
    });

    return toSummary(row);
  } catch (error) {
    console.warn('recompute course progress failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseProgressRepositoryError();
  }
}

export async function updateLastVisited(input: LastVisitedInput): Promise<CourseProgressSummary | null> {
  const courseId = normalizeOptionalString(input.courseId);
  const goal = normalizeOptionalString(input.goal);
  const lastVisitedUrl = normalizeOptionalString(input.lastVisitedUrl);
  const lastPageType = normalizeOptionalString(input.lastPageType);
  if (!courseId || !goal || !lastVisitedUrl || !lastPageType) {
    throw new CourseProgressRepositoryError('课程访问位置参数不完整');
  }

  try {
    const course = await prisma.course.findFirst({ where: { id: courseId, status: 'active' }, select: { anonymousId: true, userId: true, goal: true, mode: true } });
    if (!course) return null;
    const anonymousId = normalizeOptionalString(input.anonymousId) || course.anonymousId || undefined;

    const row = await prisma.courseProgress.upsert({
      where: { courseId },
      create: {
        courseId,
        anonymousId,
        userId: course.userId || undefined,
        goal: course.goal || goal,
        mode: normalizeOptionalString(input.mode) || course.mode,
        lastVisitedUrl: lastVisitedUrl.slice(0, 1200),
        lastPageType: lastPageType.slice(0, 40),
        lastPhaseIndex: input.lastPhaseIndex,
        lastPhaseName: normalizeOptionalString(input.lastPhaseName)?.slice(0, 500),
        lastTopicIndex: input.lastTopicIndex,
        lastTopicTitle: normalizeOptionalString(input.lastTopicTitle)?.slice(0, 500),
      },
      update: {
        anonymousId,
        userId: course.userId || undefined,
        goal: course.goal || goal,
        mode: normalizeOptionalString(input.mode) || course.mode,
        lastVisitedUrl: lastVisitedUrl.slice(0, 1200),
        lastPageType: lastPageType.slice(0, 40),
        lastPhaseIndex: input.lastPhaseIndex,
        lastPhaseName: normalizeOptionalString(input.lastPhaseName)?.slice(0, 500),
        lastTopicIndex: input.lastTopicIndex,
        lastTopicTitle: normalizeOptionalString(input.lastTopicTitle)?.slice(0, 500),
      },
      select: {
        courseId: true,
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
    });
    return toSummary(row);
  } catch (error) {
    console.warn('update last visited failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseProgressRepositoryError();
  }
}

export async function listCourseProgressByCourseIds(courseIds: string[]) {
  const safeIds = [...new Set(courseIds.map((id) => normalizeOptionalString(id)).filter(Boolean) as string[])];
  if (safeIds.length === 0) return new Map<string, CourseProgressSummary>();

  try {
    const rows = await prisma.courseProgress.findMany({
      where: { courseId: { in: safeIds } },
      select: {
        courseId: true,
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
    });
    return new Map(rows.map((row) => [row.courseId, toSummary(row)]));
  } catch (error) {
    console.warn('list course progress failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseProgressRepositoryError();
  }
}

export function createEmptyCourseProgress(courseId: string): CourseProgressSummary {
  return {
    courseId,
    overallPercent: 0,
    completedCount: 0,
    totalCount: 0,
    lastVisitedUrl: null,
    lastPageType: null,
    lastPhaseIndex: null,
    lastPhaseName: null,
    lastTopicIndex: null,
    lastTopicTitle: null,
    updatedAt: new Date(0),
  };
}

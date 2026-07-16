import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listCourseProgressByCourseIds } from '@/lib/course/courseProgressRepository';
import type { CourseHistoryMode } from '@/lib/courseHistory';
import type { MockPlan, ResourceItem } from '@/lib/mockPlan';

const MAX_RESOURCE_DESCRIPTION_LENGTH = 500;
const MAX_TEXT_LENGTH = 10_000;
const MAX_JSON_LENGTH = 900_000;

type CreateCourseSnapshotInput = {
  anonymousId?: string;
  userId?: string;
  goal: string;
  mode: CourseHistoryMode;
  title: string;
  summary?: string;
  source?: string;
  payload: unknown;
};

const courseWithLatestSnapshotInclude = {
  snapshots: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
};

type CourseWithLatestSnapshot = Prisma.CourseGetPayload<{ include: typeof courseWithLatestSnapshotInclude }>;

export class CourseRepositoryError extends Error {
  constructor(message = '课程历史加载失败，请稍后重试') {
    super(message);
    this.name = 'CourseRepositoryError';
  }
}

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function stripUnsafeKeys(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (typeof value === 'string') {
    if (value.length > MAX_TEXT_LENGTH) return value.slice(0, MAX_TEXT_LENGTH);
    return value;
  }
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => stripUnsafeKeys(item, depth + 1)).filter((item) => item !== undefined);

  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(record)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('base64') ||
      lowerKey.includes('image') ||
      lowerKey.includes('rawerror') ||
      lowerKey.includes('stack')
    ) {
      continue;
    }
    const sanitized = stripUnsafeKeys(childValue, depth + 1);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeResources(resources: unknown): ResourceItem[] {
  if (!Array.isArray(resources)) return [];
  return resources.slice(0, 12).map((item) => {
    const resource = item && typeof item === 'object' ? item as Partial<ResourceItem> : {};
    return {
      name: String(resource.name || '').slice(0, 300),
      type: resource.type || '其他',
      difficulty: resource.difficulty || '入门',
      free: Boolean(resource.free),
      description: String(resource.description || '').slice(0, MAX_RESOURCE_DESCRIPTION_LENGTH),
      href: String(resource.href || '').slice(0, 1000),
    };
  }).filter((item) => item.name && item.href) as ResourceItem[];
}

export function sanitizeCoursePayload(payload: unknown): unknown {
  const stripped = stripUnsafeKeys(payload);
  if (!stripped || typeof stripped !== 'object' || Array.isArray(stripped)) return stripped;

  const plan = stripped as Partial<MockPlan>;
  const sanitized = {
    title: plan.title,
    duration: plan.duration,
    summary: plan.summary,
    courseIntro: plan.courseIntro,
    overview: plan.overview,
    audience: plan.audience,
    prerequisites: plan.prerequisites,
    outcome: plan.outcome,
    learningOutcomes: plan.learningOutcomes,
    slides: plan.slides,
    mindMap: plan.mindMap,
    roadmap: plan.roadmap,
    courseStructure: plan.courseStructure,
    resources: sanitizeResources(plan.resources),
    projects: plan.projects,
  };

  const json = JSON.stringify(sanitized);
  if (json.length <= MAX_JSON_LENGTH) return sanitized;

  return {
    ...sanitized,
    slides: Array.isArray(plan.slides) ? plan.slides.slice(0, 20) : plan.slides,
    roadmap: Array.isArray(plan.roadmap) ? plan.roadmap.slice(0, 12) : plan.roadmap,
    resources: sanitizeResources(plan.resources).slice(0, 8),
    projects: Array.isArray(plan.projects) ? plan.projects.slice(0, 12) : plan.projects,
  };
}

export async function createOrUpdateCourseSnapshot(input: CreateCourseSnapshotInput) {
  try {
    const goal = input.goal.trim();
    const title = input.title.trim();
    if (!goal || !title) throw new CourseRepositoryError('课程信息不完整');

    const course = await prisma.course.create({
      data: {
        anonymousId: normalizeOptionalString(input.anonymousId),
        userId: normalizeOptionalString(input.userId),
        goal,
        mode: input.mode,
        title,
        summary: normalizeOptionalString(input.summary),
        source: normalizeOptionalString(input.source) || 'ai',
        snapshots: {
          create: {
            version: 1,
            payload: sanitizeCoursePayload(input.payload) as Prisma.InputJsonValue,
          },
        },
      },
      select: { id: true },
    });

    return { courseId: course.id };
  } catch (error) {
    if (error instanceof CourseRepositoryError) throw error;
    console.warn('create course snapshot failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}


export async function getCourseWithLatestSnapshot(courseId: string) {
  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, status: 'active' },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!course || course.snapshots.length === 0) return null;
    const [snapshot] = course.snapshots;
    return { course, snapshot };
  } catch (error) {
    console.warn('get course snapshot failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

type RequesterInput = {
  userId?: string;
  anonymousId?: string;
};

type ListCoursesInput = RequesterInput & {
  limit?: number;
  offset?: number;
};

function clampTake(value?: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(Math.trunc(value || 50), 1), 100);
}

function clampSkip(value?: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(Math.trunc(value || 0), 0);
}

export async function listCoursesForUserOrAnonymous(input: ListCoursesInput) {
  try {
    const safeAnonymousId = normalizeOptionalString(input.anonymousId);
    const safeUserId = normalizeOptionalString(input.userId);
    if (!safeUserId && !safeAnonymousId) return [];

    const courses = await prisma.course.findMany({
      where: safeUserId ? { userId: safeUserId, status: 'active' } : { anonymousId: safeAnonymousId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: clampTake(input.limit),
      skip: clampSkip(input.offset),
      select: {
        id: true,
        goal: true,
        mode: true,
        title: true,
        summary: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const progressByCourseId = await listCourseProgressByCourseIds(courses.map((course) => course.id));
    return courses.map((course) => ({ ...course, progress: progressByCourseId.get(course.id) || null }));
  } catch (error) {
    console.warn('list courses failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

export async function getCourseOwnedByRequester(input: { courseId: string } & RequesterInput): Promise<CourseWithLatestSnapshot | null> {
  try {
    const courseId = normalizeOptionalString(input.courseId);
    const safeAnonymousId = normalizeOptionalString(input.anonymousId);
    const safeUserId = normalizeOptionalString(input.userId);
    if (!courseId || (!safeUserId && !safeAnonymousId)) return null;

    const course = await prisma.course.findFirst({
      where: { id: courseId, status: 'active' },
      include: courseWithLatestSnapshotInclude,
    });

    if (!course) return null;

    if (safeUserId) {
      if (course.userId === safeUserId) return course;
      if (!course.userId && safeAnonymousId && course.anonymousId === safeAnonymousId) {
        await prisma.$transaction([
          prisma.course.update({
            where: { id: course.id },
            data: { userId: safeUserId },
          }),
          prisma.courseProgress.updateMany({
            where: { courseId: course.id },
            data: { userId: safeUserId },
          }),
        ]);
        return prisma.course.findFirst({
          where: { id: course.id, status: 'active' },
          include: courseWithLatestSnapshotInclude,
        });
      }
      return null;
    }

    if (safeAnonymousId && course.anonymousId === safeAnonymousId) return course;
    return null;
  } catch (error) {
    console.warn('get owned course failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

export async function listRecentCourses({ anonymousId, userId, limit = 5 }: { anonymousId?: string; userId?: string; limit?: number }) {
  return listCoursesForUserOrAnonymous({ anonymousId, userId, limit: Math.min(Math.max(limit, 1), 5), offset: 0 });
}

export async function deleteCourseForRequester(input: { courseId: string } & RequesterInput) {
  try {
    const course = await getCourseOwnedByRequester(input);
    if (!course) return false;

    await prisma.course.delete({ where: { id: course.id } });
    return true;
  } catch (error) {
    console.warn('delete course failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

export async function deleteCourse(courseId: string, anonymousId?: string, userId?: string) {
  return deleteCourseForRequester({ courseId, anonymousId, userId });
}

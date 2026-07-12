import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
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

export class CourseRepositoryError extends Error {
  constructor(message = '课程历史暂时不可用') {
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

export async function listRecentCourses({ anonymousId, limit = 5 }: { anonymousId?: string; limit?: number }) {
  try {
    const safeAnonymousId = normalizeOptionalString(anonymousId);
    if (!safeAnonymousId) return [];
    return prisma.course.findMany({
      where: { anonymousId: safeAnonymousId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 5),
      select: {
        id: true,
        goal: true,
        mode: true,
        title: true,
        summary: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.warn('list courses failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

export async function deleteCourse(courseId: string, anonymousId?: string) {
  try {
    const safeAnonymousId = normalizeOptionalString(anonymousId);
    const result = await prisma.course.deleteMany({
      where: {
        id: courseId,
        ...(safeAnonymousId ? { anonymousId: safeAnonymousId } : {}),
      },
    });
    return result.count > 0;
  } catch (error) {
    console.warn('delete course failed', error instanceof Error ? error.message : 'unknown');
    throw new CourseRepositoryError();
  }
}

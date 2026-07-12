import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const MAX_TEXT_LENGTH = 10_000;
const MAX_JSON_LENGTH = 900_000;
const MAX_TITLE_LENGTH = 500;

export type LearningSessionLookupInput = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topicTitle: string;
};

export type UpsertLearningSessionInput = LearningSessionLookupInput & {
  title: string;
  summary?: string;
  searchQuery?: string;
  content: unknown;
  references?: unknown;
  fallbackUsed?: boolean;
  source?: string;
};

export class LearningSessionRepositoryError extends Error {
  constructor(message = '学习内容暂时不可用') {
    super(message);
    this.name = 'LearningSessionRepositoryError';
  }
}

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeRequiredString(value: string, fallback = '') {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function assertPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function validateLookup(input: LearningSessionLookupInput) {
  const goal = normalizeRequiredString(input.goal);
  if (!goal || !assertPositiveInteger(input.phaseIndex) || !assertPositiveInteger(input.topicIndex)) {
    throw new LearningSessionRepositoryError('学习内容参数不完整');
  }
}

function stripUnsafeKeys(value: unknown, depth = 0): unknown {
  if (depth > 10) return undefined;
  if (typeof value === 'string') {
    return value.length > MAX_TEXT_LENGTH ? value.slice(0, MAX_TEXT_LENGTH) : value;
  }
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => stripUnsafeKeys(item, depth + 1)).filter((item) => item !== undefined);

  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(record)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('image') ||
      lowerKey.includes('base64') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('stack') ||
      lowerKey.includes('providererror') ||
      lowerKey.includes('rawerror')
    ) {
      continue;
    }
    const sanitized = stripUnsafeKeys(childValue, depth + 1);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

export function sanitizeLearningSessionJson(value: unknown): Prisma.InputJsonValue {
  const sanitized = stripUnsafeKeys(value);
  if (sanitized === undefined) return {};

  const json = JSON.stringify(sanitized);
  if (json.length <= MAX_JSON_LENGTH) return sanitized as Prisma.InputJsonValue;

  if (Array.isArray(sanitized)) return sanitized.slice(0, 50) as Prisma.InputJsonValue;
  if (sanitized && typeof sanitized === 'object') {
    const record = sanitized as Record<string, unknown>;
    return {
      title: record.title,
      summary: record.summary,
      keyConcepts: record.keyConcepts,
      lessonSteps: Array.isArray(record.lessonSteps) ? record.lessonSteps.slice(0, 8) : record.lessonSteps,
      examples: Array.isArray(record.examples) ? record.examples.slice(0, 6) : record.examples,
      practice: Array.isArray(record.practice) ? record.practice.slice(0, 8) : record.practice,
      commonMistakes: record.commonMistakes,
      checkpoint: record.checkpoint,
      resourceSummary: record.resourceSummary,
      references: Array.isArray(record.references) ? record.references.slice(0, 8) : record.references,
    } as Prisma.InputJsonValue;
  }

  return sanitized as Prisma.InputJsonValue;
}

function toSessionSelect() {
  return {
    id: true,
    courseId: true,
    anonymousId: true,
    goal: true,
    mode: true,
    phaseIndex: true,
    phaseName: true,
    topicIndex: true,
    topicTitle: true,
    title: true,
    summary: true,
    searchQuery: true,
    content: true,
    references: true,
    fallbackUsed: true,
    source: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.LearningSessionSelect;
}

export async function getLearningSession(input: LearningSessionLookupInput) {
  try {
    validateLookup(input);
    const courseId = normalizeOptionalString(input.courseId);
    const goal = normalizeRequiredString(input.goal);
    const mode = normalizeOptionalString(input.mode);

    if (courseId) {
      return await prisma.learningSession.findUnique({
        where: { courseId_phaseIndex_topicIndex: { courseId, phaseIndex: input.phaseIndex, topicIndex: input.topicIndex } },
        select: toSessionSelect(),
      });
    }

    const anonymousId = normalizeOptionalString(input.anonymousId);
    if (!anonymousId) return null;

    return await prisma.learningSession.findFirst({
      where: {
        anonymousId,
        goal,
        ...(mode ? { mode } : {}),
        phaseIndex: input.phaseIndex,
        topicIndex: input.topicIndex,
      },
      orderBy: { updatedAt: 'desc' },
      select: toSessionSelect(),
    });
  } catch (error) {
    if (error instanceof LearningSessionRepositoryError) throw error;
    console.warn('get learning session failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningSessionRepositoryError();
  }
}

export async function upsertLearningSession(input: UpsertLearningSessionInput) {
  try {
    validateLookup(input);
    const courseId = normalizeOptionalString(input.courseId);
    const anonymousId = normalizeOptionalString(input.anonymousId);
    const goal = normalizeRequiredString(input.goal);
    const title = normalizeRequiredString(input.title);
    if (!title || input.content === undefined || input.content === null) throw new LearningSessionRepositoryError('学习内容参数不完整');

    const data = {
      courseId,
      anonymousId,
      goal,
      mode: normalizeOptionalString(input.mode),
      phaseIndex: input.phaseIndex,
      phaseName: normalizeRequiredString(input.phaseName, `阶段${input.phaseIndex}`).slice(0, MAX_TITLE_LENGTH),
      topicIndex: input.topicIndex,
      topicTitle: normalizeRequiredString(input.topicTitle, title).slice(0, MAX_TITLE_LENGTH),
      title: title.slice(0, MAX_TITLE_LENGTH),
      summary: normalizeOptionalString(input.summary),
      searchQuery: normalizeOptionalString(input.searchQuery),
      content: sanitizeLearningSessionJson(input.content),
      references: input.references === undefined ? Prisma.JsonNull : sanitizeLearningSessionJson(input.references),
      fallbackUsed: Boolean(input.fallbackUsed),
      source: normalizeOptionalString(input.source) || (input.fallbackUsed ? 'fallback' : 'ai'),
    } satisfies Prisma.LearningSessionUncheckedCreateInput;

    if (courseId) {
      return await prisma.learningSession.upsert({
        where: { courseId_phaseIndex_topicIndex: { courseId, phaseIndex: input.phaseIndex, topicIndex: input.topicIndex } },
        update: {
          anonymousId: data.anonymousId,
          goal: data.goal,
          mode: data.mode,
          phaseName: data.phaseName,
          topicTitle: data.topicTitle,
          title: data.title,
          summary: data.summary,
          searchQuery: data.searchQuery,
          content: data.content,
          references: data.references,
          fallbackUsed: data.fallbackUsed,
          source: data.source,
        },
        create: data,
        select: toSessionSelect(),
      });
    }

    const existing = anonymousId
      ? await prisma.learningSession.findFirst({
          where: {
            anonymousId,
            goal,
            ...(data.mode ? { mode: data.mode } : {}),
            phaseIndex: input.phaseIndex,
            topicIndex: input.topicIndex,
          },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        })
      : null;

    return existing
      ? await prisma.learningSession.update({ where: { id: existing.id }, data, select: toSessionSelect() })
      : await prisma.learningSession.create({ data, select: toSessionSelect() });
  } catch (error) {
    if (error instanceof LearningSessionRepositoryError) throw error;
    console.warn('upsert learning session failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningSessionRepositoryError('学习内容保存失败');
  }
}

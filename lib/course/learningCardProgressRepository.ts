import { prisma } from '@/lib/db/prisma';

export type LearningCardStatus = 'not_started' | 'in_progress' | 'completed';

export type LearningCardProgressItem = {
  phaseIndex: number;
  topicIndex: number;
  topicTitle: string;
  status: LearningCardStatus;
};

type ListLearningCardProgressInput = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  phaseIndex?: number;
  phaseName?: string;
};

type UpsertLearningCardProgressInput = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topicTitle: string;
  status: LearningCardStatus;
};

export class LearningCardProgressRepositoryError extends Error {
  constructor(message = '学习卡片进度加载失败，请稍后重试') {
    super(message);
    this.name = 'LearningCardProgressRepositoryError';
  }
}

export function normalizeLearningCardStatus(value: unknown): LearningCardStatus {
  return value === 'in_progress' || value === 'completed' || value === 'not_started' ? value : 'not_started';
}

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeMode(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function validateList(input: ListLearningCardProgressInput) {
  const goal = input.goal.trim();
  if (!goal) throw new LearningCardProgressRepositoryError('学习卡片进度参数不完整');
  const phaseIndex = input.phaseIndex;
  if (phaseIndex !== undefined && (!Number.isInteger(phaseIndex) || phaseIndex < 1)) {
    throw new LearningCardProgressRepositoryError('学习卡片进度参数不完整');
  }
  return {
    courseId: normalizeOptionalString(input.courseId),
    anonymousId: normalizeOptionalString(input.anonymousId),
    goal,
    mode: normalizeMode(input.mode),
    phaseIndex,
    phaseName: normalizeOptionalString(input.phaseName),
  };
}

function validateUpsert(input: UpsertLearningCardProgressInput) {
  const goal = input.goal.trim();
  if (!goal || !Number.isInteger(input.phaseIndex) || input.phaseIndex < 1 || !Number.isInteger(input.topicIndex) || input.topicIndex < 0 || !input.topicTitle.trim()) {
    throw new LearningCardProgressRepositoryError('学习卡片进度参数不完整');
  }
  return {
    courseId: normalizeOptionalString(input.courseId),
    anonymousId: normalizeOptionalString(input.anonymousId),
    goal,
    mode: normalizeMode(input.mode),
    phaseIndex: input.phaseIndex,
    phaseName: input.phaseName.trim() || `阶段${input.phaseIndex}`,
    topicIndex: input.topicIndex,
    topicTitle: input.topicTitle.trim().slice(0, 500),
    status: normalizeLearningCardStatus(input.status),
  };
}

export async function listLearningCardProgress(input: ListLearningCardProgressInput): Promise<LearningCardProgressItem[]> {
  try {
    const base = validateList(input);
    if (!base.courseId && !base.anonymousId) return [];

    const rows = await prisma.learningCardProgress.findMany({
      where: base.courseId
        ? {
            courseId: base.courseId,
            ...(base.phaseIndex ? { phaseIndex: base.phaseIndex } : {}),
          }
        : {
            courseId: null,
            anonymousId: base.anonymousId,
            goal: base.goal,
            mode: base.mode,
            ...(base.phaseIndex ? { phaseIndex: base.phaseIndex } : {}),
          },
      orderBy: [{ phaseIndex: 'asc' }, { topicIndex: 'asc' }],
      select: { phaseIndex: true, topicIndex: true, topicTitle: true, status: true },
    });

    return rows.map((row) => ({
      phaseIndex: row.phaseIndex,
      topicIndex: row.topicIndex,
      topicTitle: row.topicTitle,
      status: normalizeLearningCardStatus(row.status),
    }));
  } catch (error) {
    if (error instanceof LearningCardProgressRepositoryError) throw error;
    console.warn('list learning card progress failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningCardProgressRepositoryError();
  }
}

export async function upsertLearningCardProgress(input: UpsertLearningCardProgressInput): Promise<LearningCardProgressItem> {
  try {
    const data = validateUpsert(input);
    if (!data.courseId && !data.anonymousId) {
      throw new LearningCardProgressRepositoryError('学习卡片进度参数不完整');
    }

    if (data.courseId) {
      const row = await prisma.learningCardProgress.upsert({
        where: {
          courseId_phaseIndex_topicIndex: {
            courseId: data.courseId,
            phaseIndex: data.phaseIndex,
            topicIndex: data.topicIndex,
          },
        },
        create: data,
        update: {
          anonymousId: data.anonymousId,
          goal: data.goal,
          mode: data.mode,
          phaseName: data.phaseName,
          topicTitle: data.topicTitle,
          status: data.status,
        },
        select: { phaseIndex: true, topicIndex: true, topicTitle: true, status: true },
      });
      return { phaseIndex: row.phaseIndex, topicIndex: row.topicIndex, topicTitle: row.topicTitle, status: normalizeLearningCardStatus(row.status) };
    }

    const existing = await prisma.learningCardProgress.findFirst({
      where: {
        courseId: null,
        anonymousId: data.anonymousId,
        goal: data.goal,
        mode: data.mode,
        phaseIndex: data.phaseIndex,
        topicIndex: data.topicIndex,
      },
      select: { id: true },
    });

    const row = existing
      ? await prisma.learningCardProgress.update({
          where: { id: existing.id },
          data: { phaseName: data.phaseName, topicTitle: data.topicTitle, status: data.status },
          select: { phaseIndex: true, topicIndex: true, topicTitle: true, status: true },
        })
      : await prisma.learningCardProgress.create({ data, select: { phaseIndex: true, topicIndex: true, topicTitle: true, status: true } });

    return { phaseIndex: row.phaseIndex, topicIndex: row.topicIndex, topicTitle: row.topicTitle, status: normalizeLearningCardStatus(row.status) };
  } catch (error) {
    if (error instanceof LearningCardProgressRepositoryError) throw error;
    console.warn('upsert learning card progress failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningCardProgressRepositoryError();
  }
}

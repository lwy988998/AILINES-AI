import { prisma } from '@/lib/db/prisma';

export type LearningStepStatus = 'unset' | 'understood' | 'review';

export type LearningStepProgressItem = {
  stepIndex: number;
  stepTitle: string;
  status: LearningStepStatus;
};

type ListLearningStepProgressInput = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  phaseIndex: number;
  phaseName: string;
};

type UpsertLearningStepProgressInput = ListLearningStepProgressInput & {
  stepIndex: number;
  stepTitle: string;
  status: LearningStepStatus;
};

export class LearningStepProgressRepositoryError extends Error {
  constructor(message = '学习步骤进度暂时不可用') {
    super(message);
    this.name = 'LearningStepProgressRepositoryError';
  }
}

export function normalizeLearningStepStatus(value: unknown): LearningStepStatus {
  return value === 'understood' || value === 'review' || value === 'unset' ? value : 'unset';
}

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeMode(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function validateBase(input: ListLearningStepProgressInput) {
  const goal = input.goal.trim();
  if (!goal || !Number.isInteger(input.phaseIndex) || input.phaseIndex < 1) {
    throw new LearningStepProgressRepositoryError('学习步骤进度参数不完整');
  }

  return {
    courseId: normalizeOptionalString(input.courseId),
    anonymousId: normalizeOptionalString(input.anonymousId),
    goal,
    mode: normalizeMode(input.mode),
    phaseIndex: input.phaseIndex,
    phaseName: input.phaseName.trim() || `阶段${input.phaseIndex}`,
  };
}

export async function listLearningStepProgress(input: ListLearningStepProgressInput): Promise<LearningStepProgressItem[]> {
  try {
    const base = validateBase(input);
    if (!base.courseId && !base.anonymousId) return [];

    const rows = await prisma.learningStepProgress.findMany({
      where: base.courseId
        ? { courseId: base.courseId, phaseIndex: base.phaseIndex }
        : {
            courseId: null,
            anonymousId: base.anonymousId,
            goal: base.goal,
            mode: base.mode,
            phaseIndex: base.phaseIndex,
          },
      orderBy: { stepIndex: 'asc' },
      select: {
        stepIndex: true,
        stepTitle: true,
        status: true,
      },
    });

    return rows.map((row) => ({
      stepIndex: row.stepIndex,
      stepTitle: row.stepTitle,
      status: normalizeLearningStepStatus(row.status),
    }));
  } catch (error) {
    if (error instanceof LearningStepProgressRepositoryError) throw error;
    console.warn('list learning step progress failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningStepProgressRepositoryError();
  }
}

export async function upsertLearningStepProgress(input: UpsertLearningStepProgressInput): Promise<LearningStepProgressItem> {
  try {
    const base = validateBase(input);
    if (!Number.isInteger(input.stepIndex) || input.stepIndex < 0 || !input.stepTitle.trim()) {
      throw new LearningStepProgressRepositoryError('学习步骤信息不完整');
    }

    if (!base.courseId && !base.anonymousId) {
      throw new LearningStepProgressRepositoryError('学习步骤进度参数不完整');
    }

    const data = {
      courseId: base.courseId,
      anonymousId: base.anonymousId,
      goal: base.goal,
      mode: base.mode,
      phaseIndex: base.phaseIndex,
      phaseName: base.phaseName,
      stepIndex: input.stepIndex,
      stepTitle: input.stepTitle.trim().slice(0, 500),
      status: normalizeLearningStepStatus(input.status),
    };

    if (base.courseId) {
      const row = await prisma.learningStepProgress.upsert({
        where: {
          courseId_phaseIndex_stepIndex: {
            courseId: base.courseId,
            phaseIndex: base.phaseIndex,
            stepIndex: input.stepIndex,
          },
        },
        create: data,
        update: {
          anonymousId: data.anonymousId,
          goal: data.goal,
          mode: data.mode,
          phaseName: data.phaseName,
          stepTitle: data.stepTitle,
          status: data.status,
        },
        select: { stepIndex: true, stepTitle: true, status: true },
      });
      return { stepIndex: row.stepIndex, stepTitle: row.stepTitle, status: normalizeLearningStepStatus(row.status) };
    }

    const existing = await prisma.learningStepProgress.findFirst({
      where: {
        courseId: null,
        anonymousId: base.anonymousId,
        goal: base.goal,
        mode: base.mode,
        phaseIndex: base.phaseIndex,
        stepIndex: input.stepIndex,
      },
      select: { id: true },
    });

    const row = existing
      ? await prisma.learningStepProgress.update({
          where: { id: existing.id },
          data: {
            phaseName: data.phaseName,
            stepTitle: data.stepTitle,
            status: data.status,
          },
          select: { stepIndex: true, stepTitle: true, status: true },
        })
      : await prisma.learningStepProgress.create({
          data,
          select: { stepIndex: true, stepTitle: true, status: true },
        });

    return { stepIndex: row.stepIndex, stepTitle: row.stepTitle, status: normalizeLearningStepStatus(row.status) };
  } catch (error) {
    if (error instanceof LearningStepProgressRepositoryError) throw error;
    console.warn('upsert learning step progress failed', error instanceof Error ? error.message : 'unknown');
    throw new LearningStepProgressRepositoryError();
  }
}

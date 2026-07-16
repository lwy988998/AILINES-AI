import { prisma } from '@/lib/db/prisma';

export type TaskProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type TaskProgressItem = {
  taskIndex: number;
  taskTitle: string;
  status: TaskProgressStatus;
};

type ListTaskProgressInput = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  phaseIndex: number;
  phaseName: string;
};

type UpsertTaskProgressInput = ListTaskProgressInput & {
  taskIndex: number;
  taskTitle: string;
  status: TaskProgressStatus;
};

export class TaskProgressRepositoryError extends Error {
  constructor(message = '任务进度加载失败，请稍后重试') {
    super(message);
    this.name = 'TaskProgressRepositoryError';
  }
}

export function normalizeTaskProgressStatus(value: unknown): TaskProgressStatus {
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

function validateBase(input: ListTaskProgressInput) {
  const goal = input.goal.trim();
  if (!goal || !Number.isInteger(input.phaseIndex) || input.phaseIndex < 1) {
    throw new TaskProgressRepositoryError('任务进度参数不完整');
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

export async function listTaskProgress(input: ListTaskProgressInput): Promise<TaskProgressItem[]> {
  try {
    const base = validateBase(input);
    if (!base.courseId && !base.anonymousId) return [];

    const rows = await prisma.taskProgress.findMany({
      where: base.courseId
        ? { courseId: base.courseId, phaseIndex: base.phaseIndex }
        : {
            courseId: null,
            anonymousId: base.anonymousId,
            goal: base.goal,
            mode: base.mode,
            phaseIndex: base.phaseIndex,
          },
      orderBy: { taskIndex: 'asc' },
      select: {
        taskIndex: true,
        taskTitle: true,
        status: true,
      },
    });

    return rows.map((row) => ({
      taskIndex: row.taskIndex,
      taskTitle: row.taskTitle,
      status: normalizeTaskProgressStatus(row.status),
    }));
  } catch (error) {
    if (error instanceof TaskProgressRepositoryError) throw error;
    console.warn('list task progress failed', error instanceof Error ? error.message : 'unknown');
    throw new TaskProgressRepositoryError();
  }
}

export async function upsertTaskProgress(input: UpsertTaskProgressInput): Promise<TaskProgressItem> {
  try {
    const base = validateBase(input);
    if (!Number.isInteger(input.taskIndex) || input.taskIndex < 0 || !input.taskTitle.trim()) {
      throw new TaskProgressRepositoryError('任务信息不完整');
    }

    if (!base.courseId && !base.anonymousId) {
      throw new TaskProgressRepositoryError('任务进度参数不完整');
    }

    const data = {
      courseId: base.courseId,
      anonymousId: base.anonymousId,
      goal: base.goal,
      mode: base.mode,
      phaseIndex: base.phaseIndex,
      phaseName: base.phaseName,
      taskIndex: input.taskIndex,
      taskTitle: input.taskTitle.trim().slice(0, 500),
      status: normalizeTaskProgressStatus(input.status),
    };

    if (base.courseId) {
      const row = await prisma.taskProgress.upsert({
        where: {
          courseId_phaseIndex_taskIndex: {
            courseId: base.courseId,
            phaseIndex: base.phaseIndex,
            taskIndex: input.taskIndex,
          },
        },
        create: data,
        update: {
          anonymousId: data.anonymousId,
          goal: data.goal,
          mode: data.mode,
          phaseName: data.phaseName,
          taskTitle: data.taskTitle,
          status: data.status,
        },
        select: { taskIndex: true, taskTitle: true, status: true },
      });
      return { taskIndex: row.taskIndex, taskTitle: row.taskTitle, status: normalizeTaskProgressStatus(row.status) };
    }

    const existing = await prisma.taskProgress.findFirst({
      where: {
        courseId: null,
        anonymousId: base.anonymousId,
        goal: base.goal,
        mode: base.mode,
        phaseIndex: base.phaseIndex,
        taskIndex: input.taskIndex,
      },
      select: { id: true },
    });

    const row = existing
      ? await prisma.taskProgress.update({
          where: { id: existing.id },
          data: {
            phaseName: data.phaseName,
            taskTitle: data.taskTitle,
            status: data.status,
          },
          select: { taskIndex: true, taskTitle: true, status: true },
        })
      : await prisma.taskProgress.create({
          data,
          select: { taskIndex: true, taskTitle: true, status: true },
        });

    return { taskIndex: row.taskIndex, taskTitle: row.taskTitle, status: normalizeTaskProgressStatus(row.status) };
  } catch (error) {
    if (error instanceof TaskProgressRepositoryError) throw error;
    console.warn('upsert task progress failed', error instanceof Error ? error.message : 'unknown');
    throw new TaskProgressRepositoryError();
  }
}

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GeneratedPlan, PlanMode } from '@/lib/ai/types';

const CACHE_DIR = path.join(process.cwd(), 'data', 'ai-plan-cache');
const DEFAULT_CACHE_TTL_SECONDS = 604_800;

type CachedPlanFile = {
  goal: string;
  mode?: PlanMode;
  createdAt: string | number;
  plan: GeneratedPlan;
};

function normalizeGoal(goal: string) {
  return goal.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCacheTtlMs() {
  const configuredTtlSeconds = Number(process.env.AI_PLAN_CACHE_TTL_SECONDS);
  const ttlSeconds = Number.isFinite(configuredTtlSeconds) && configuredTtlSeconds > 0 ? configuredTtlSeconds : DEFAULT_CACHE_TTL_SECONDS;
  return ttlSeconds * 1000;
}

function normalizeMode(mode: PlanMode = 'deep') {
  return mode === 'lite' ? 'lite' : 'deep';
}

function getCacheFilePath(goal: string, mode: PlanMode = 'deep') {
  const key = createHash('sha256').update(`${normalizeMode(mode)}:${normalizeGoal(goal)}`).digest('hex');
  return path.join(CACHE_DIR, `${key}.json`);
}

function getCreatedAtMs(createdAt: string | number) {
  return typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
}

function isFresh(createdAt: string | number) {
  const createdAtMs = getCreatedAtMs(createdAt);
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < getCacheTtlMs();
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidStepArray(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every(
        (step) =>
          step &&
          typeof step === 'object' &&
          typeof (step as { title?: unknown }).title === 'string' &&
          typeof (step as { explanation?: unknown }).explanation === 'string' &&
          typeof (step as { action?: unknown }).action === 'string' &&
          typeof (step as { check?: unknown }).check === 'string',
      ))
  );
}

export function isValidGeneratedPlan(plan: unknown): plan is GeneratedPlan {
  if (!plan || typeof plan !== 'object') {
    return false;
  }

  const candidate = plan as GeneratedPlan;

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.goal === 'string' &&
    typeof candidate.durationWeeks === 'number' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.phases) &&
    candidate.phases.length > 0 &&
    candidate.phases.every(
      (phase) =>
        typeof phase.name === 'string' &&
        typeof phase.durationWeeks === 'number' &&
        typeof phase.objective === 'string' &&
        typeof phase.description === 'string' &&
        isStringArray(phase.topics) &&
        isValidStepArray(phase.steps),
    ) &&
    Array.isArray(candidate.resources) &&
    candidate.resources.length > 0 &&
    candidate.resources.every(
      (resource) =>
        typeof resource.name === 'string' &&
        typeof resource.type === 'string' &&
        typeof resource.difficulty === 'string' &&
        typeof resource.free === 'boolean' &&
        typeof resource.description === 'string' &&
        typeof resource.url === 'string',
    ) &&
    Array.isArray(candidate.projects) &&
    candidate.projects.length > 0 &&
    candidate.projects.every(
      (project) =>
        typeof project.name === 'string' &&
        typeof project.difficulty === 'string' &&
        typeof project.estimatedHours === 'number' &&
        typeof project.output === 'string' &&
        isStringArray(project.acceptanceCriteria),
    )
  );
}

export async function readCachedPlan(goal: string, mode: PlanMode = 'deep'): Promise<GeneratedPlan | null> {
  try {
    const cachedFile = await readFile(getCacheFilePath(goal, mode), 'utf8');
    const cachedPlan = JSON.parse(cachedFile) as CachedPlanFile;

    if (!cachedPlan.plan || !isFresh(cachedPlan.createdAt) || !isValidGeneratedPlan(cachedPlan.plan)) {
      return null;
    }

    return cachedPlan.plan;
  } catch {
    return null;
  }
}

export async function writeCachedPlan(goal: string, mode: PlanMode = 'deep', plan: GeneratedPlan) {
  if (!isValidGeneratedPlan(plan)) {
    return;
  }

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const cachedPlan: CachedPlanFile = {
      goal: goal.trim(),
      mode: normalizeMode(mode),
      createdAt: new Date().toISOString(),
      plan,
    };

    await writeFile(getCacheFilePath(goal, mode), JSON.stringify(cachedPlan, null, 2), 'utf8');
  } catch (error) {
    console.warn('AI plan cache write failed', error instanceof Error ? error.message : 'unknown error');
  }
}

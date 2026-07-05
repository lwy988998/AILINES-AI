import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GeneratedPlan } from '@/lib/ai/types';

const CACHE_DIR = path.join(process.cwd(), 'data', 'ai-plan-cache');
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedPlanFile = {
  goal: string;
  createdAt: string | number;
  plan: GeneratedPlan;
};

function normalizeGoal(goal: string) {
  return goal.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCacheTtlMs() {
  const configuredTtl = Number(process.env.AI_PLAN_CACHE_TTL_MS);
  return Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : DEFAULT_CACHE_TTL_MS;
}

function getCacheFilePath(goal: string) {
  const key = createHash('sha256').update(normalizeGoal(goal)).digest('hex');
  return path.join(CACHE_DIR, `${key}.json`);
}

function getCreatedAtMs(createdAt: string | number) {
  return typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
}

function isFresh(createdAt: string | number) {
  const createdAtMs = getCreatedAtMs(createdAt);
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < getCacheTtlMs();
}

export async function readCachedPlan(goal: string): Promise<GeneratedPlan | null> {
  try {
    const cachedFile = await readFile(getCacheFilePath(goal), 'utf8');
    const cachedPlan = JSON.parse(cachedFile) as CachedPlanFile;

    if (!cachedPlan.plan || !isFresh(cachedPlan.createdAt)) {
      return null;
    }

    return cachedPlan.plan;
  } catch {
    return null;
  }
}

export async function writeCachedPlan(goal: string, plan: GeneratedPlan) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachedPlan: CachedPlanFile = {
    goal: goal.trim(),
    createdAt: new Date().toISOString(),
    plan,
  };

  await writeFile(getCacheFilePath(goal), JSON.stringify(cachedPlan, null, 2), 'utf8');
}

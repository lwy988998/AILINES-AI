import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LearningDomain } from '@/lib/learningDomain';
import type { SearchProvider } from '@/lib/search/searchProvider';
import type { SearchResourcesResult } from '@/lib/search/resourceTypes';

const CACHE_DIR = path.join(process.cwd(), 'data', 'resource-search-cache');
const DEFAULT_CACHE_TTL_SECONDS = 604_800;

type CachedResourceSearch = Omit<SearchResourcesResult, 'cache'> & {
  provider: SearchProvider;
  fallbackUsed: boolean;
  createdAt: string | number;
};

function normalizeGoal(goal: string) {
  return goal.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCacheTtlMs() {
  const configuredTtlSeconds = Number(process.env.RESOURCE_SEARCH_CACHE_TTL_SECONDS);
  const ttlSeconds = Number.isFinite(configuredTtlSeconds) && configuredTtlSeconds > 0 ? configuredTtlSeconds : DEFAULT_CACHE_TTL_SECONDS;
  return ttlSeconds * 1000;
}

function getCacheFilePath(primaryProvider: SearchProvider, fallbackProvider: SearchProvider | null, domain: LearningDomain, goal: string) {
  const key = createHash('sha256').update(`${primaryProvider}:${fallbackProvider || 'none'}:${domain}:${normalizeGoal(goal)}`).digest('hex');
  return path.join(CACHE_DIR, `${key}.json`);
}

function getCreatedAtMs(createdAt: string | number) {
  return typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
}

function isFresh(createdAt: string | number) {
  const createdAtMs = getCreatedAtMs(createdAt);
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < getCacheTtlMs();
}

function isValidCachedResourceSearch(value: unknown): value is CachedResourceSearch {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as CachedResourceSearch;

  return (
    typeof candidate.goal === 'string' &&
    typeof candidate.domain === 'string' &&
    Array.isArray(candidate.queries) &&
    Array.isArray(candidate.resources) &&
    candidate.resources.every((resource) => typeof resource?.title === 'string' && typeof resource?.url === 'string') &&
    typeof candidate.createdAt !== 'undefined'
  );
}

export async function readCachedResourceSearch(
  primaryProvider: SearchProvider,
  fallbackProvider: SearchProvider | null,
  domain: LearningDomain,
  goal: string,
): Promise<SearchResourcesResult | null> {
  try {
    const cachedFile = await readFile(getCacheFilePath(primaryProvider, fallbackProvider, domain, goal), 'utf8');
    const cached = JSON.parse(cachedFile) as unknown;

    if (!isValidCachedResourceSearch(cached) || !isFresh(cached.createdAt)) {
      return null;
    }

    return {
      goal: cached.goal,
      domain: cached.domain,
      queries: cached.queries,
      resources: cached.resources,
      provider: cached.provider,
      fallbackUsed: Boolean(cached.fallbackUsed),
      cache: 'hit',
    };
  } catch {
    return null;
  }
}

export async function writeCachedResourceSearch(primaryProvider: SearchProvider, fallbackProvider: SearchProvider | null, result: SearchResourcesResult) {
  if (!result.resources.length) {
    return;
  }

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const cached: CachedResourceSearch = {
      goal: result.goal,
      domain: result.domain,
      queries: result.queries,
      resources: result.resources,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      createdAt: new Date().toISOString(),
    };

    await writeFile(getCacheFilePath(primaryProvider, fallbackProvider, result.domain, result.goal), JSON.stringify(cached, null, 2), 'utf8');
  } catch (error) {
    console.warn('Resource search cache write failed', error instanceof Error ? error.message : 'unknown error');
  }
}

export { CACHE_DIR as RESOURCE_SEARCH_CACHE_DIR };

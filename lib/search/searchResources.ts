import { detectLearningDomain } from '@/lib/learningDomain';
import { normalizeResource } from '@/lib/search/normalizeResource';
import { readCachedResourceSearch, writeCachedResourceSearch } from '@/lib/search/resourceCache';
import { normalizeSearchProvider, searchWithProvider, type RawSearchResult, type SearchProvider } from '@/lib/search/searchProvider';
import type { SearchResource, SearchResourcesResult } from '@/lib/search/resourceTypes';

export class ResourceSearchError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'ResourceSearchError';
    this.status = status;
  }
}

function buildQueries(goal: string, domain: ReturnType<typeof detectLearningDomain>) {
  const cleanGoal = goal.trim();

  switch (domain) {
    case 'math':
      return [
        `${cleanGoal} 入门 教程 课程`,
        `${cleanGoal} 公式 练习题 视频`,
        `Khan Academy ${cleanGoal}`,
        `3Blue1Brown ${cleanGoal}`,
        `B站 ${cleanGoal} 入门 视频`,
      ];
    case 'programming':
      return [
        `${cleanGoal} 官方文档 入门教程`,
        `${cleanGoal} GitHub 项目 实战`,
        `${cleanGoal} beginner tutorial project`,
        `${cleanGoal} 视频教程`,
      ];
    case 'office':
      return [
        `${cleanGoal} 教程 模板`,
        `${cleanGoal} 高级函数 数据透视表`,
        `${cleanGoal} 视频课程`,
        `${cleanGoal} 办公 实战 案例`,
      ];
    case 'language':
      return [
        `${cleanGoal} 口语 单词 语法`,
        `${cleanGoal} 听力 课程`,
        `${cleanGoal} 入门 教程`,
        `${cleanGoal} practice exercise`,
      ];
    case 'design':
      return [
        `${cleanGoal} 教程 案例`,
        `${cleanGoal} 作品练习 视频课程`,
        `${cleanGoal} 入门 tutorial`,
        `${cleanGoal} design practice`,
      ];
    case 'ai':
      return [
        `${cleanGoal} 入门 课程 教程`,
        `${cleanGoal} 官方文档 实战`,
        `${cleanGoal} 视频教程`,
        `${cleanGoal} practice project`,
      ];
    default:
      return [
        `${cleanGoal} 入门 教程 课程`,
        `${cleanGoal} 学习资源 练习`,
        `${cleanGoal} 视频教程`,
        `${cleanGoal} guide tutorial`,
      ];
  }
}

function dedupeAndLimit(resources: SearchResource[]) {
  const seen = new Set<string>();
  const deduped: SearchResource[] = [];

  for (const resource of resources) {
    const key = resource.url.trim().replace(/\/$/, '').toLowerCase();
    if (!resource.title.trim() || !resource.url.trim() || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(resource);
  }

  return deduped.sort((a, b) => b.score - a.score).slice(0, 20);
}

function getConfiguredProviders() {
  const primaryProvider = normalizeSearchProvider(process.env.SEARCH_PROVIDER, 'tavily');
  const fallbackProvider = normalizeSearchProvider(process.env.SEARCH_FALLBACK_PROVIDER, primaryProvider === 'bocha' ? 'tavily' : 'bocha');

  return {
    primaryProvider,
    fallbackProvider: fallbackProvider === primaryProvider ? null : fallbackProvider,
  };
}

async function searchProviderOrNull(provider: SearchProvider, queries: string[]) {
  try {
    const rawResults = await searchWithProvider(provider, queries);
    return rawResults;
  } catch {
    return null;
  }
}

function normalizeRawResults(rawResults: RawSearchResult[], domain: ReturnType<typeof detectLearningDomain>) {
  return dedupeAndLimit(
    rawResults
      .map((result) => normalizeResource(result, domain))
      .filter((resource): resource is SearchResource => Boolean(resource)),
  );
}

export async function searchResources(goal: string): Promise<SearchResourcesResult> {
  const safeGoal = goal.trim();

  if (!safeGoal) {
    throw new ResourceSearchError('请提供学习目标', 400);
  }

  const { primaryProvider, fallbackProvider } = getConfiguredProviders();
  const domain = detectLearningDomain(safeGoal);
  const cached = await readCachedResourceSearch(primaryProvider, fallbackProvider, domain, safeGoal);

  if (cached) {
    return cached;
  }

  const queries = buildQueries(safeGoal, domain);
  let successfulProvider: SearchProvider | null = null;
  let fallbackUsed = false;
  let rawResults = await searchProviderOrNull(primaryProvider, queries);

  if (rawResults?.length) {
    successfulProvider = primaryProvider;
  } else if (fallbackProvider) {
    rawResults = await searchProviderOrNull(fallbackProvider, queries);
    if (rawResults?.length) {
      successfulProvider = fallbackProvider;
      fallbackUsed = true;
    }
  }

  if (!successfulProvider || !rawResults?.length) {
    throw new ResourceSearchError('资源搜索暂时失败，请稍后重试', 502);
  }

  const resources = normalizeRawResults(rawResults, domain);

  if (!resources.length) {
    throw new ResourceSearchError('资源搜索暂时失败，请稍后重试', 502);
  }

  const response: SearchResourcesResult = {
    goal: safeGoal,
    domain,
    queries,
    resources,
    provider: successfulProvider,
    fallbackUsed,
    cache: 'miss',
  };

  await writeCachedResourceSearch(primaryProvider, fallbackProvider, response);
  return response;
}

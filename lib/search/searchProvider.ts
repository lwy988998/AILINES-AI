import { searchBocha } from '@/lib/search/bochaClient';
import { searchTavily } from '@/lib/search/tavilyClient';

export type SearchProvider = 'bocha' | 'tavily';

export type RawSearchResult = {
  title: string;
  url: string;
  content?: string;
  source?: string;
  score?: number;
};

export class SearchProviderError extends Error {
  provider: SearchProvider;

  constructor(provider: SearchProvider, message = 'search provider failed') {
    super(message);
    this.name = 'SearchProviderError';
    this.provider = provider;
  }
}

export function normalizeSearchProvider(value: string | undefined, fallback: SearchProvider): SearchProvider {
  const normalized = value?.trim().replace(/^['\"]|['\"]$/g, '').toLowerCase();

  if (normalized === 'bocha' || normalized === 'tavily') {
    return normalized;
  }

  return fallback;
}

export function hasProviderKey(provider: SearchProvider) {
  if (provider === 'bocha') return Boolean(process.env.BOCHA_API_KEY?.trim());
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export async function searchWithProvider(provider: SearchProvider, queries: string[]): Promise<RawSearchResult[]> {
  if (!hasProviderKey(provider)) {
    throw new SearchProviderError(provider, 'provider key missing');
  }

  const results = await Promise.all(queries.map((query) => (provider === 'bocha' ? searchBocha(query) : searchTavily(query))));
  const flattened = results.flat().filter((result) => result.title?.trim() && result.url?.trim());

  if (!flattened.length) {
    throw new SearchProviderError(provider, 'provider returned empty results');
  }

  return flattened;
}

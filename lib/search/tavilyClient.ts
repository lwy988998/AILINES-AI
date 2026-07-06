import type { RawSearchResult } from '@/lib/search/searchProvider';

type TavilySearchResult = RawSearchResult;

type TavilySearchResponse = {
  results?: TavilySearchResult[];
};

export class TavilySearchError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'TavilySearchError';
    this.status = status;
  }
}

export async function searchTavily(query: string): Promise<RawSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new TavilySearchError('TAVILY_API_KEY 未配置', 500);
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    throw new TavilySearchError('资源搜索暂时失败，请稍后重试', 502);
  }

  const data = (await response.json()) as TavilySearchResponse;
  return Array.isArray(data.results) ? data.results : [];
}

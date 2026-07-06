import type { RawSearchResult } from '@/lib/search/searchProvider';

const DEFAULT_BOCHA_BASE_URL = 'https://api.bochaai.com';
const BOCHA_TIMEOUT_MS = 15_000;

type BochaWebPage = {
  name?: unknown;
  title?: unknown;
  url?: unknown;
  snippet?: unknown;
  summary?: unknown;
  content?: unknown;
  siteName?: unknown;
  site?: unknown;
};

type BochaSearchResponse = {
  data?: {
    webPages?: {
      value?: BochaWebPage[];
    };
    results?: BochaWebPage[];
  };
  results?: BochaWebPage[];
};

export class BochaSearchError extends Error {
  constructor(message = 'Bocha search failed') {
    super(message);
    this.name = 'BochaSearchError';
  }
}

function getBochaEndpoint() {
  const baseUrl = process.env.BOCHA_BASE_URL?.trim().replace(/\/$/, '') || DEFAULT_BOCHA_BASE_URL;
  return `${baseUrl}/v1/web-search`;
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractBochaResults(data: BochaSearchResponse): BochaWebPage[] {
  if (Array.isArray(data.data?.webPages?.value)) return data.data.webPages.value;
  if (Array.isArray(data.data?.results)) return data.data.results;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function normalizeBochaResult(result: BochaWebPage): RawSearchResult | null {
  const title = toStringValue(result.name) || toStringValue(result.title);
  const url = toStringValue(result.url);

  if (!title || !url) return null;

  return {
    title,
    url,
    content: toStringValue(result.summary) || toStringValue(result.snippet) || toStringValue(result.content),
    source: toStringValue(result.siteName) || toStringValue(result.site),
  };
}

export async function searchBocha(query: string): Promise<RawSearchResult[]> {
  const apiKey = process.env.BOCHA_API_KEY;

  if (!apiKey) {
    throw new BochaSearchError('Bocha key missing');
  }

  const response = await fetch(getBochaEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(BOCHA_TIMEOUT_MS),
    body: JSON.stringify({
      query,
      count: 5,
      summary: true,
      freshness: 'noLimit',
    }),
  });

  if (!response.ok) {
    throw new BochaSearchError('Bocha request failed');
  }

  const data = (await response.json()) as BochaSearchResponse;
  return extractBochaResults(data)
    .map(normalizeBochaResult)
    .filter((result): result is RawSearchResult => Boolean(result));
}

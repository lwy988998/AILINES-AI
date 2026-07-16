import { AIClientError, toSafeAIError } from '@/lib/ai/aiClient';

const DEFAULT_IMAGE_TIMEOUT_MS = 45_000;
const MAX_PROMPT_LENGTH = 2_000;
const IMAGE_UNAVAILABLE_MESSAGE = '图片生成未完成';

type ImageProviderConfig = {
  id: 'grok' | 'gpt';
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type GenerateImageInput = {
  prompt: string;
  size?: string;
  style?: string;
};

export type GeneratedImageResult = {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  revisedPrompt?: string;
  provider: string;
  model: string;
};

export class ImageGenerationError extends Error {
  type: string;
  status?: number;

  constructor(message = IMAGE_UNAVAILABLE_MESSAGE, type = 'unknown', status?: number) {
    super(message);
    this.name = 'ImageGenerationError';
    this.type = type;
    this.status = status;
  }
}

function envValue(name: string) {
  return (process.env[name] || '').trim();
}

export function getImageGenerationProviders(): ImageProviderConfig[] {
  const candidates: Array<{
    id: 'grok' | 'gpt';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }> = [
    {
      id: 'grok',
      apiKey: envValue('GROK_IMAGE_API_KEY'),
      baseUrl: envValue('GROK_IMAGE_BASE_URL'),
      model: envValue('GROK_IMAGE_MODEL'),
    },
    {
      id: 'gpt',
      apiKey: envValue('GPT_IMAGE_API_KEY'),
      baseUrl: envValue('GPT_IMAGE_BASE_URL'),
      model: envValue('GPT_IMAGE_MODEL'),
    },
  ];

  return candidates
    .filter((provider) => provider.apiKey && provider.baseUrl && provider.model)
    .map((provider) => ({
      id: provider.id,
      apiKey: provider.apiKey as string,
      baseUrl: normalizeBaseUrl(provider.baseUrl as string),
      model: provider.model as string,
    }));
}

function logMissingProviderConfig() {
  console.warn('image provider config summary', {
    grokApiKey: envValue('GROK_IMAGE_API_KEY') ? 'set' : 'missing',
    grokBaseUrl: envValue('GROK_IMAGE_BASE_URL') ? 'set' : 'missing',
    grokModel: envValue('GROK_IMAGE_MODEL') ? 'set' : 'missing',
    gptApiKey: envValue('GPT_IMAGE_API_KEY') ? 'set' : 'missing',
    gptBaseUrl: envValue('GPT_IMAGE_BASE_URL') ? 'set' : 'missing',
    gptModel: envValue('GPT_IMAGE_MODEL') ? 'set' : 'missing',
  });
}

function getImageTimeoutMs() {
  return DEFAULT_IMAGE_TIMEOUT_MS;
}

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ').slice(0, MAX_PROMPT_LENGTH);
}

function normalizeSize(size?: string) {
  const value = (size || '1024x1024').trim();
  const allowed = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto']);
  return allowed.has(value) ? value : '1024x1024';
}

function normalizeStyle(style?: string) {
  const value = (style || 'default').trim();
  return value || 'default';
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildImageEndpoints(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (/\/v1$/i.test(normalized)) return [`${normalized}/images/generations`];
  return [`${normalized}/v1/images/generations`, `${normalized}/images/generations`];
}

function classifyStatus(status: number) {
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500 && status <= 599) return 'provider_5xx';
  return 'invalid_response';
}

function getEndpointSummary(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return { host: url.hostname, path: url.pathname };
  } catch {
    return { host: 'invalid-url', path: 'invalid-url' };
  }
}

function logImageFailure(provider: ImageProviderConfig, error: AIClientError, promptLength: number, endpoint?: string) {
  const endpointSummary = endpoint ? getEndpointSummary(endpoint) : undefined;
  console.warn('image provider failed', {
    provider: provider.id,
    errorType: error.type,
    status: error.status,
    endpointHost: endpointSummary?.host,
    endpointPath: endpointSummary?.path,
    promptLength,
  });
}

function logImageProviderSkipped(providerId: 'grok' | 'gpt') {
  console.info('image provider skipped due to missing config', { provider: providerId });
}

async function postImageGeneration(
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const endpointSummary = getEndpointSummary(endpoint);

  try {
    console.info('image provider request', {
      endpointHost: endpointSummary.host,
      endpointPath: endpointSummary.path,
      timeoutMs,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new AIClientError(classifyStatus(response.status), 'AI image provider rejected request', response.status);
    }

    try {
      return (rawText ? JSON.parse(rawText) : {}) as Record<string, unknown>;
    } catch {
      throw new AIClientError('invalid_response', 'AI image provider returned non-JSON response');
    }
  } catch (error) {
    if (error instanceof AIClientError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIClientError('timeout', 'AI image provider request timed out');
    }
    throw new AIClientError('network_error', 'AI image provider network error');
  } finally {
    clearTimeout(timeoutId);
  }
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function firstObject(...values: unknown[]) {
  return values.find((value): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value));
}

function parseImageResponse(response: Record<string, unknown>) {
  const firstData = Array.isArray(response.data) ? response.data[0] as Record<string, unknown> | undefined : undefined;
  const firstOutput = Array.isArray(response.output) ? response.output[0] as Record<string, unknown> | undefined : undefined;
  const imageUrlObject = firstObject(firstData?.image_url, firstOutput?.image_url, response.image_url);
  const imageObject = firstObject(firstData?.image, firstOutput?.image, response.image);
  const revisedPrompt = firstString(response.revised_prompt, response.revisedPrompt, firstData?.revised_prompt, firstData?.revisedPrompt);
  const imageUrl = firstString(
    response.url,
    response.imageUrl,
    response.output_url,
    firstData?.url,
    firstData?.imageUrl,
    firstData?.output_url,
    firstOutput?.url,
    firstOutput?.imageUrl,
    firstOutput?.output_url,
    imageUrlObject?.url,
    imageObject?.url,
  );
  const imageBase64 = firstString(
    response.b64_json,
    response.base64,
    response.image_base64,
    firstData?.b64_json,
    firstData?.base64,
    firstData?.image_base64,
    firstOutput?.b64_json,
    firstOutput?.base64,
    firstOutput?.image_base64,
    imageObject?.b64_json,
    imageObject?.base64,
  );
  const mimeType = firstString(response.mime_type, response.mimeType, firstData?.mime_type, firstData?.mimeType, firstOutput?.mime_type, firstOutput?.mimeType) || 'image/png';

  if (!imageUrl && !imageBase64) return null;
  return {
    imageUrl,
    imageBase64,
    mimeType,
    revisedPrompt,
  };
}

export async function generateImage(input: GenerateImageInput): Promise<GeneratedImageResult> {
  const safePrompt = normalizePrompt(input.prompt);
  if (!safePrompt) {
    throw new ImageGenerationError('请输入图片需求', 'invalid_input');
  }

  const providers = getImageGenerationProviders();
  if (!envValue('GROK_IMAGE_API_KEY') || !envValue('GROK_IMAGE_BASE_URL') || !envValue('GROK_IMAGE_MODEL')) {
    logImageProviderSkipped('grok');
  }
  if (!envValue('GPT_IMAGE_API_KEY') || !envValue('GPT_IMAGE_BASE_URL') || !envValue('GPT_IMAGE_MODEL')) {
    logImageProviderSkipped('gpt');
  }
  if (providers.length === 0) {
    logMissingProviderConfig();
    throw new ImageGenerationError(IMAGE_UNAVAILABLE_MESSAGE, 'missing_config');
  }

  const timeoutMs = getImageTimeoutMs();
  const size = normalizeSize(input.size);
  const style = normalizeStyle(input.style);
  const prompt = style && style !== 'default' ? `${safePrompt}\n风格：${style}` : safePrompt;
  let lastError: AIClientError | null = null;

  for (const provider of providers) {
    const requestBody = {
      model: provider.model,
      prompt,
      size,
      n: 1,
    };

    for (const endpoint of buildImageEndpoints(provider.baseUrl)) {
      try {
        const response = await postImageGeneration(endpoint, provider.apiKey, requestBody, timeoutMs);
        const parsed = parseImageResponse(response);
        if (!parsed) {
          throw new AIClientError('invalid_response', 'AI image provider returned empty content');
        }

        return {
          ...parsed,
          provider: provider.id,
          model: provider.model,
        };
      } catch (error) {
        const classified = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
        lastError = classified;
        logImageFailure(provider, classified, safePrompt.length, endpoint);

        if (classified.status === 404 && !/\/v1\/images\/generations$/i.test(endpoint)) {
          break;
        }
        if (classified.status === 404) {
          continue;
        }
        break;
      }
    }
  }

  throw new ImageGenerationError(IMAGE_UNAVAILABLE_MESSAGE, lastError?.type || 'unknown', lastError?.status);
}

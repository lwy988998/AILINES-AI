import { AIClientError, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';

const DEFAULT_IMAGE_TIMEOUT_MS = 45_000;
const MAX_PROMPT_LENGTH = 2_000;
const IMAGE_UNAVAILABLE_MESSAGE = '生图暂不可用';

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
      apiKey: envValue('GPT_IMAGE_API_KEY') || envValue('AI_IMAGE_API_KEY'),
      baseUrl: envValue('GPT_IMAGE_BASE_URL') || envValue('AI_IMAGE_BASE_URL'),
      model: envValue('GPT_IMAGE_MODEL') || envValue('AI_IMAGE_MODEL'),
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
    gptApiKey: envValue('GPT_IMAGE_API_KEY') || envValue('AI_IMAGE_API_KEY') ? 'set' : 'missing',
    gptBaseUrl: envValue('GPT_IMAGE_BASE_URL') || envValue('AI_IMAGE_BASE_URL') ? 'set' : 'missing',
    gptModel: envValue('GPT_IMAGE_MODEL') || envValue('AI_IMAGE_MODEL') ? 'set' : 'missing',
  });
}

function getImageTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_IMAGE_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : getAIRequestTimeoutMs(DEFAULT_IMAGE_TIMEOUT_MS);
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

function parseImageResponse(response: Record<string, unknown>) {
  const topLevelImageUrl = typeof response.url === 'string' ? response.url : undefined;
  const revisedPrompt = typeof response.revised_prompt === 'string'
    ? response.revised_prompt
    : typeof response.revisedPrompt === 'string'
      ? response.revisedPrompt
      : undefined;
  const firstData = Array.isArray(response.data) ? response.data[0] as Record<string, unknown> | undefined : undefined;
  const dataUrl = firstData && typeof firstData.url === 'string' ? firstData.url : undefined;
  const imageBase64 = firstData && typeof firstData.b64_json === 'string' ? firstData.b64_json : undefined;
  const mimeType = firstData && typeof firstData.mime_type === 'string' ? firstData.mime_type : 'image/png';

  if (!topLevelImageUrl && !dataUrl && !imageBase64) return null;
  return {
    imageUrl: topLevelImageUrl || dataUrl,
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
  if (!(envValue('GPT_IMAGE_API_KEY') || envValue('AI_IMAGE_API_KEY')) || !(envValue('GPT_IMAGE_BASE_URL') || envValue('AI_IMAGE_BASE_URL')) || !(envValue('GPT_IMAGE_MODEL') || envValue('AI_IMAGE_MODEL'))) {
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

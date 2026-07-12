import { AIClientError, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';

const DEFAULT_IMAGE_TIMEOUT_MS = 45_000;
const RETRY_DELAYS_MS = [600];
const MAX_PROMPT_LENGTH = 2_000;
const IMAGE_CONFIG_MISSING_MESSAGE = '生图服务尚未配置，请在服务器环境变量中配置 AI_IMAGE_API_KEY、AI_IMAGE_BASE_URL 和 AI_IMAGE_MODEL。';
const IMAGE_UNAVAILABLE_MESSAGE = '当前生图服务暂时不可用，请稍后重试。';

type ImageProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
  source: 'image' | 'fallback';
  modelConfigured: boolean;
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

function safeProviderFromBaseUrl(baseUrl: string, fallback: string) {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return fallback;
  }
}

export function getImageGenerationConfig(): ImageProviderConfig {
  const imageApiKey = (process.env.AI_IMAGE_API_KEY || process.env.IMAGE_API_KEY || '').trim();
  const imageBaseUrl = (process.env.AI_IMAGE_BASE_URL || process.env.IMAGE_BASE_URL || '').trim();
  const imageModel = (process.env.AI_IMAGE_MODEL || process.env.IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || '').trim();

  if (imageApiKey && imageBaseUrl && imageModel) {
    return {
      apiKey: imageApiKey,
      baseUrl: imageBaseUrl.replace(/\/$/, ''),
      model: imageModel,
      provider: process.env.AI_IMAGE_PROVIDER || safeProviderFromBaseUrl(imageBaseUrl, 'image-provider'),
      source: 'image',
      modelConfigured: true,
    };
  }

  const fallbackApiKey = (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const fallbackBaseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || '').trim();
  const fallbackModel = (process.env.AI_MODEL || process.env.OPENAI_MODEL || '').trim();

  if (fallbackApiKey && fallbackBaseUrl && imageModel) {
    return {
      apiKey: fallbackApiKey,
      baseUrl: fallbackBaseUrl.replace(/\/$/, ''),
      model: imageModel,
      provider: process.env.AI_PROVIDER || safeProviderFromBaseUrl(fallbackBaseUrl, 'fallback-ai-provider'),
      source: 'fallback',
      modelConfigured: true,
    };
  }

  console.warn('image provider config missing', {
    imageApiKey: imageApiKey ? 'set' : 'missing',
    imageBaseUrl: imageBaseUrl ? 'set' : 'missing',
    imageModel: imageModel ? 'set' : 'missing',
    fallbackApiKey: fallbackApiKey ? 'set' : 'missing',
    fallbackBaseUrl: fallbackBaseUrl ? 'set' : 'missing',
    fallbackModel: fallbackModel ? 'set' : 'missing',
  });

  throw new ImageGenerationError(IMAGE_CONFIG_MISSING_MESSAGE, 'missing_config');
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

function classifyStatus(status: number) {
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500 && status <= 599) return 'provider_5xx';
  return 'invalid_response';
}

function logImageFailure(config: ImageProviderConfig, error: AIClientError, promptLength: number) {
  console.warn('image provider request failed', {
    provider: config.provider,
    source: config.source,
    modelConfigured: config.modelConfigured ? 'set' : 'missing',
    errorType: error.type,
    status: error.status,
    promptLength,
  });
}

function getImageEndpointBaseUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, '');
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
}

async function postImageGeneration(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getImageEndpointBaseUrl(baseUrl)}/images/generations`, {
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

    let parsed: unknown;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new AIClientError('invalid_response', 'AI image provider returned non-JSON response');
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AIClientError) throw error;
    const safeError = error instanceof Error && error.name === 'AbortError'
      ? new AIClientError('timeout', 'AI image provider request timed out')
      : new AIClientError('network_error', 'AI image provider network error');
    throw safeError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateImage(input: GenerateImageInput): Promise<GeneratedImageResult> {
  const safePrompt = normalizePrompt(input.prompt);
  if (!safePrompt) {
    throw new ImageGenerationError('请输入图片需求', 'invalid_input');
  }

  const config = getImageGenerationConfig();
  const timeoutMs = getImageTimeoutMs();
  const size = normalizeSize(input.size);
  const style = normalizeStyle(input.style);
  const requestBody = {
    model: config.model,
    prompt: style && style !== 'default' ? `${safePrompt}\n风格：${style}` : safePrompt,
    size,
  };

  let lastError: AIClientError | null = null;

  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt += 1) {
    try {
      const response = await postImageGeneration(config.baseUrl, config.apiKey, requestBody, timeoutMs);

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

      if (topLevelImageUrl || dataUrl || imageBase64) {
        return {
          imageUrl: topLevelImageUrl || dataUrl,
          imageBase64,
          mimeType,
          revisedPrompt,
          provider: config.provider,
          model: config.model,
        };
      }

      throw new AIClientError('invalid_response', 'AI image provider returned empty content');
    } catch (error) {
      const classified = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
      lastError = classified;
      logImageFailure(config, classified, safePrompt.length);

      if (classified.status === 400 || classified.status === 404 || classified.status === 405 || classified.type === 'missing_config' || classified.type === 'auth_error' || classified.type === 'invalid_response') {
        break;
      }

      if (attempt <= RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
        continue;
      }

      break;
    }
  }

  throw new ImageGenerationError(IMAGE_UNAVAILABLE_MESSAGE, lastError?.type || 'unknown', lastError?.status);
}

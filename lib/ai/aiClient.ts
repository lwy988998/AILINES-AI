export type AIErrorType =
  | 'missing_config'
  | 'auth_error'
  | 'rate_limited'
  | 'timeout'
  | 'provider_5xx'
  | 'network_error'
  | 'invalid_response'
  | 'json_parse_error'
  | 'unknown';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: unknown;
};

export type ChatCompletionOptions = {
  messages: readonly ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object';
  timeoutMs?: number;
  purpose: 'plan' | 'ask' | 'image';
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type ClientConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
};

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [500, 1200];

export class AIClientError extends Error {
  type: AIErrorType;
  status?: number;

  constructor(type: AIErrorType, message: string, status?: number) {
    super(message);
    this.name = 'AIClientError';
    this.type = type;
    this.status = status;
  }
}

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAIRequestTimeoutMs(overrideMs?: number) {
  if (Number.isFinite(overrideMs) && Number(overrideMs) > 0) {
    return Number(overrideMs);
  }

  return readPositiveNumber(process.env.AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
}

export function getAIConfig(modelOverride?: string): ClientConfig {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';

  if (!apiKey.trim()) {
    throw new AIClientError('missing_config', 'AI provider config missing');
  }

  const baseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_AI_BASE_URL).trim();
  const model = (modelOverride || process.env.AI_MODEL || process.env.OPENAI_MODEL || DEFAULT_AI_MODEL).trim();
  const provider = process.env.AI_PROVIDER || new URL(baseUrl).hostname;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    model,
    provider,
  };
}

function classifyStatus(status: number): AIErrorType {
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500 && status <= 599) return 'provider_5xx';
  return 'invalid_response';
}

function shouldRetry(error: AIClientError) {
  return error.type === 'timeout' || error.type === 'rate_limited' || error.type === 'provider_5xx' || error.type === 'network_error';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeError(error: unknown): AIClientError {
  if (error instanceof AIClientError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AIClientError('timeout', 'AI provider request timed out');
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new AIClientError('timeout', 'AI provider request timed out');
    }

    return new AIClientError('network_error', 'AI provider network error');
  }

  return new AIClientError('unknown', 'AI provider unknown error');
}

function logAttempt(config: ClientConfig, error: AIClientError, attempt: number, promptBytes: number, responseBytes?: number) {
  console.warn('AI provider call failed', {
    provider: config.provider,
    model: config.model,
    errorType: error.type,
    status: error.status,
    attempt,
    promptBytes,
    responseBytes,
  });
}

async function postChatCompletion(
  config: ClientConfig,
  body: Record<string, unknown>,
  timeoutMs: number,
  attempt: number,
  promptBytes: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new AIClientError(classifyStatus(response.status), 'AI provider rejected request', response.status);
    }

    let data: ChatCompletionResponse;

    try {
      data = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new AIClientError('invalid_response', 'AI provider returned non-JSON response', response.status);
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new AIClientError('invalid_response', 'AI provider returned empty content', response.status);
    }

    return content;
  } catch (error) {
    const classified = sanitizeError(error);
    logAttempt(config, classified, attempt, promptBytes);
    throw classified;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const config = getAIConfig(options.model);
  const timeoutMs = getAIRequestTimeoutMs(options.timeoutMs);
  const deadline = Date.now() + timeoutMs;
  const promptBytes = JSON.stringify(options.messages).length;
  const baseBody = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens,
    ...(options.responseFormat ? { response_format: { type: options.responseFormat } } : {}),
  };

  let lastError: AIClientError | null = null;

  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt += 1) {
    const remainingMs = deadline - Date.now();

    if (remainingMs <= 0) {
      throw lastError || new AIClientError('timeout', 'AI provider request timed out');
    }

    const body = lastError?.status === 400 ? { ...baseBody, response_format: undefined } : baseBody;

    try {
      return await postChatCompletion(config, body, remainingMs, attempt, promptBytes);
    } catch (error) {
      const classified = sanitizeError(error);
      lastError = classified;

      if (classified.status === 400 && body.response_format) {
        continue;
      }

      if (!shouldRetry(classified) || attempt > RETRY_DELAYS_MS.length) {
        throw classified;
      }

      const retryDelayMs = RETRY_DELAYS_MS[attempt - 1];

      if (Date.now() + retryDelayMs >= deadline) {
        throw classified;
      }

      await delay(retryDelayMs);
    }
  }

  throw lastError || new AIClientError('unknown', 'AI provider unknown error');
}

export function toSafeAIError(error: unknown, fallbackType: AIErrorType = 'unknown') {
  if (error instanceof AIClientError) {
    return error;
  }

  return new AIClientError(fallbackType, 'AI provider request failed');
}

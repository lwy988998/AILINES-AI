export type AIErrorType =
  | 'missing_config'
  | 'auth_error'
  | 'rate_limited'
  | 'timeout'
  | 'provider_5xx'
  | 'provider_unavailable'
  | 'network_error'
  | 'invalid_response'
  | 'json_parse_error'
  | 'quality_rejected'
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
  maxAttempts?: number;
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
  id: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
  role: 'primary' | 'fallback' | 'secondary';
  priority: number;
};

export type AIProviderStatus = {
  id: string;
  provider: string;
  role: ClientConfig['role'];
  priority: number;
  baseUrl: string;
  model: string;
  configured: boolean;
  healthy: boolean | null;
  circuit: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastErrorType?: AIErrorType;
  lastStatus?: number;
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  openedUntil?: string;
};

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const DEFAULT_TIMEOUT_MS = 35_000;
const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_BACKOFF_MS = 800;
const DEFAULT_CIRCUIT_FAILURE_THRESHOLD = 3;
const DEFAULT_CIRCUIT_OPEN_MS = 60_000;

type ProviderRuntimeState = {
  failureCount: number;
  lastErrorType?: AIErrorType;
  lastStatus?: number;
  lastCheckedAt?: number;
  lastSuccessAt?: number;
  openedUntil?: number;
};

const providerStates = new Map<string, ProviderRuntimeState>();

export class AIClientError extends Error {
  type: AIErrorType;
  status?: number;
  provider?: string;
  baseUrl?: string;
  model?: string;

  constructor(type: AIErrorType, message: string, status?: number, context?: Partial<Pick<AIClientError, 'provider' | 'baseUrl' | 'model'>>) {
    super(message);
    this.name = 'AIClientError';
    this.type = type;
    this.status = status;
    this.provider = context?.provider;
    this.baseUrl = context?.baseUrl;
    this.model = context?.model;
  }
}

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAIRequestTimeoutMs(overrideMs?: number) {
  const fallback = Number.isFinite(overrideMs) && Number(overrideMs) > 0 ? Number(overrideMs) : DEFAULT_TIMEOUT_MS;
  return readPositiveNumber(process.env.AI_TIMEOUT_MS, fallback);
}

function getMaxAttempts(overrideAttempts?: number) {
  const configured = readPositiveInteger(process.env.AI_RETRY_ATTEMPTS, DEFAULT_RETRY_ATTEMPTS);
  const requested = Number.isInteger(overrideAttempts) && Number(overrideAttempts) > 0 ? Number(overrideAttempts) : configured;
  return Math.max(1, Math.min(requested, 4));
}

function getRetryBackoffMs(attempt: number) {
  const base = readPositiveNumber(process.env.AI_RETRY_BACKOFF_MS, DEFAULT_RETRY_BACKOFF_MS);
  return Math.round(base * Math.pow(2, Math.max(attempt - 1, 0)));
}

function getCircuitFailureThreshold() {
  return readPositiveInteger(process.env.AI_CIRCUIT_FAILURE_THRESHOLD, DEFAULT_CIRCUIT_FAILURE_THRESHOLD);
}

function getCircuitOpenMs() {
  return readPositiveNumber(process.env.AI_CIRCUIT_OPEN_MS, DEFAULT_CIRCUIT_OPEN_MS);
}

function inferProvider(baseUrl: string, fallback: string) {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return fallback;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, '');
}

function makeProviderId(provider: string, baseUrl: string, model: string) {
  return `${provider}:${baseUrl}:${model}`;
}

function buildConfig(input: { apiKey?: string; baseUrl?: string; model?: string; provider?: string; role: ClientConfig['role']; priority: number }): ClientConfig | null {
  const apiKey = (input.apiKey || '').trim();
  const baseUrl = normalizeBaseUrl(input.baseUrl || '');
  if (!apiKey || !baseUrl) return null;

  const model = (input.model || DEFAULT_AI_MODEL).trim();
  const provider = (input.provider || inferProvider(baseUrl, input.role)).trim();

  return {
    id: makeProviderId(provider, baseUrl, model),
    apiKey,
    baseUrl,
    model,
    provider,
    role: input.role,
    priority: input.priority,
  };
}

export function getAIConfig(modelOverride?: string): ClientConfig {
  return getAIConfigs(modelOverride)[0];
}

function getAIConfigs(modelOverride?: string): ClientConfig[] {
  const primaryBaseUrl = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_AI_BASE_URL;
  const primaryModel = modelOverride || process.env.AI_MODEL || process.env.OPENAI_MODEL || DEFAULT_AI_MODEL;
  const configs = [
    buildConfig({
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: primaryBaseUrl,
      model: primaryModel,
      provider: process.env.AI_PROVIDER,
      role: 'primary',
      priority: 10,
    }),
    buildConfig({
      apiKey: process.env.AI_API_KEY_FALLBACK || process.env.OPENAI_API_KEY_FALLBACK,
      baseUrl: process.env.AI_BASE_URL_FALLBACK || process.env.OPENAI_BASE_URL_FALLBACK,
      model: modelOverride || process.env.AI_MODEL_FALLBACK || process.env.OPENAI_MODEL_FALLBACK || primaryModel,
      provider: process.env.AI_PROVIDER_FALLBACK,
      role: 'fallback',
      priority: 90,
    }),
    buildConfig({
      apiKey: process.env.AI_API_KEY_SECONDARY || process.env.OPENAI_API_KEY_SECONDARY,
      baseUrl: process.env.AI_BASE_URL_SECONDARY || process.env.OPENAI_BASE_URL_SECONDARY,
      model: modelOverride || process.env.AI_MODEL_SECONDARY || process.env.OPENAI_MODEL_SECONDARY || primaryModel,
      provider: process.env.AI_PROVIDER_SECONDARY,
      role: 'secondary',
      priority: 95,
    }),
    buildConfig({
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.AI_DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || DEFAULT_AI_BASE_URL,
      model: modelOverride || process.env.DEEPSEEK_MODEL || DEFAULT_AI_MODEL,
      provider: process.env.DEEPSEEK_PROVIDER || 'deepseek',
      role: 'fallback',
      priority: 100,
    }),
  ].filter((config): config is ClientConfig => Boolean(config));

  const deduped = configs
    .sort((left, right) => left.priority - right.priority)
    .filter((config, index, list) => list.findIndex((item) => item.baseUrl === config.baseUrl && item.model === config.model) === index);

  if (deduped.length === 0) {
    throw new AIClientError('missing_config', 'AI provider config missing');
  }

  return deduped;
}

function getRuntimeState(config: ClientConfig) {
  const existing = providerStates.get(config.id);
  if (existing) return existing;

  const created: ProviderRuntimeState = { failureCount: 0 };
  providerStates.set(config.id, created);
  return created;
}

function getCircuitState(config: ClientConfig): AIProviderStatus['circuit'] {
  const state = getRuntimeState(config);
  if (!state.openedUntil) return 'closed';
  return Date.now() >= state.openedUntil ? 'half_open' : 'open';
}

function recordSuccess(config: ClientConfig) {
  const state = getRuntimeState(config);
  state.failureCount = 0;
  state.lastErrorType = undefined;
  state.lastStatus = undefined;
  state.lastCheckedAt = Date.now();
  state.lastSuccessAt = Date.now();
  state.openedUntil = undefined;
}

function recordFailure(config: ClientConfig, error: AIClientError) {
  const state = getRuntimeState(config);
  state.failureCount += 1;
  state.lastErrorType = error.type;
  state.lastStatus = error.status;
  state.lastCheckedAt = Date.now();

  if (shouldOpenCircuit(error) && state.failureCount >= getCircuitFailureThreshold()) {
    state.openedUntil = Date.now() + getCircuitOpenMs();
  }
}

function classifyStatus(status: number): AIErrorType {
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500 && status <= 599) return 'provider_5xx';
  return 'invalid_response';
}

function shouldRetry(error: AIClientError) {
  return error.type === 'timeout' || error.type === 'rate_limited' || error.type === 'provider_5xx' || error.type === 'network_error' || error.type === 'provider_unavailable';
}

function shouldOpenCircuit(error: AIClientError) {
  return error.type === 'timeout' || error.type === 'rate_limited' || error.type === 'provider_5xx' || error.type === 'network_error' || error.type === 'provider_unavailable';
}

function shouldTryFallback(error: AIClientError) {
  return shouldRetry(error);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withContext(error: AIClientError, config?: ClientConfig) {
  if (!config) return error;
  error.provider ||= config.provider;
  error.baseUrl ||= config.baseUrl;
  error.model ||= config.model;
  return error;
}

function sanitizeError(error: unknown, config?: ClientConfig): AIClientError {
  if (error instanceof AIClientError) {
    return withContext(error, config);
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return withContext(new AIClientError('timeout', 'AI provider request timed out'), config);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return withContext(new AIClientError('timeout', 'AI provider request timed out'), config);
    }

    return withContext(new AIClientError('network_error', error.message || 'AI provider network error'), config);
  }

  return withContext(new AIClientError('unknown', 'AI provider unknown error'), config);
}

function getChatCompletionsUrl(config: ClientConfig) {
  return config.baseUrl.endsWith('/v1') ? `${config.baseUrl}/chat/completions` : `${config.baseUrl}/v1/chat/completions`;
}

function getModelsUrl(config: ClientConfig) {
  return config.baseUrl.endsWith('/v1') ? `${config.baseUrl}/models` : `${config.baseUrl}/v1/models`;
}

function logProviderEvent(event: string, input: Record<string, unknown>) {
  console.warn(`AI provider ${event} ${JSON.stringify(input)}`);
}

function logAttempt(input: { config: ClientConfig; error: AIClientError; attempt: number; promptBytes: number; route?: string; fallbackAvailable: boolean }) {
  logProviderEvent('call_failed', {
    name: input.error.name,
    message: input.error.message,
    code: input.error.type,
    status: input.error.status,
    provider: input.config.provider,
    baseUrl: input.config.baseUrl,
    model: input.config.model,
    providerRole: input.config.role,
    priority: input.config.priority,
    route: input.route || 'chat-completions',
    attempt: input.attempt,
    promptBytes: input.promptBytes,
    fallbackAvailable: input.fallbackAvailable,
    circuit: getCircuitState(input.config),
  });
}

async function postChatCompletion(
  config: ClientConfig,
  body: Record<string, unknown>,
  timeoutMs: number,
  attempt: number,
  promptBytes: number,
  fallbackAvailable: boolean,
  route: string,
) {
  const circuit = getCircuitState(config);
  if (circuit === 'open') {
    throw new AIClientError('provider_unavailable', 'AI provider circuit is open', undefined, config);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getChatCompletionsUrl(config), {
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
      throw new AIClientError(classifyStatus(response.status), 'AI provider rejected request', response.status, config);
    }

    let data: ChatCompletionResponse;

    try {
      data = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new AIClientError('invalid_response', 'AI provider returned non-JSON response', response.status, config);
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new AIClientError('invalid_response', 'AI provider returned empty content', response.status, config);
    }

    recordSuccess(config);
    return content;
  } catch (error) {
    const classified = sanitizeError(error, config);
    recordFailure(config, classified);
    logAttempt({ config, error: classified, attempt, promptBytes, fallbackAvailable, route });
    throw classified;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runProviderAttempts(config: ClientConfig, body: Record<string, unknown>, timeoutMs: number, promptBytes: number, maxAttempts: number, fallbackAvailable: boolean, route: string) {
  let lastError: AIClientError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const requestBody = lastError?.status === 400 ? { ...body, response_format: undefined } : body;

    try {
      return await postChatCompletion(config, requestBody, timeoutMs, attempt, promptBytes, fallbackAvailable, route);
    } catch (error) {
      const classified = sanitizeError(error, config);
      lastError = classified;

      if (classified.status === 400 && requestBody.response_format) {
        continue;
      }

      if (!shouldRetry(classified) || attempt >= maxAttempts) {
        throw classified;
      }

      await delay(getRetryBackoffMs(attempt));
    }
  }

  throw lastError || new AIClientError('unknown', 'AI provider unknown error', undefined, config);
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const configs = getAIConfigs(options.model);
  const timeoutMs = getAIRequestTimeoutMs(options.timeoutMs);
  const promptBytes = JSON.stringify(options.messages).length;
  const maxAttempts = getMaxAttempts(options.maxAttempts);
  let lastError: AIClientError | null = null;

  for (let configIndex = 0; configIndex < configs.length; configIndex += 1) {
    const config = configs[configIndex];
    const body = {
      model: config.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens,
      ...(options.responseFormat ? { response_format: { type: options.responseFormat } } : {}),
    };

    try {
      return await runProviderAttempts(config, body, timeoutMs, promptBytes, maxAttempts, configs.length > configIndex + 1, options.purpose);
    } catch (error) {
      const classified = sanitizeError(error, config);
      lastError = classified;

      if (!shouldTryFallback(classified) || configIndex >= configs.length - 1) {
        throw classified;
      }

      logProviderEvent('fallback_starting', {
        name: classified.name,
        message: classified.message,
        code: classified.type,
        status: classified.status,
        provider: config.provider,
        baseUrl: config.baseUrl,
        model: config.model,
        nextProvider: configs[configIndex + 1].provider,
        nextBaseUrl: configs[configIndex + 1].baseUrl,
        nextModel: configs[configIndex + 1].model,
        route: options.purpose,
      });
    }
  }

  throw lastError || new AIClientError('provider_unavailable', 'AI provider unavailable');
}

function toIso(value?: number) {
  return value ? new Date(value).toISOString() : undefined;
}

function configToStatus(config: ClientConfig): AIProviderStatus {
  const state = getRuntimeState(config);
  const circuit = getCircuitState(config);
  return {
    id: config.id,
    provider: config.provider,
    role: config.role,
    priority: config.priority,
    baseUrl: config.baseUrl,
    model: config.model,
    configured: true,
    healthy: state.lastSuccessAt ? true : state.lastErrorType ? false : null,
    circuit,
    failureCount: state.failureCount,
    lastErrorType: state.lastErrorType,
    lastStatus: state.lastStatus,
    lastCheckedAt: toIso(state.lastCheckedAt),
    lastSuccessAt: toIso(state.lastSuccessAt),
    openedUntil: circuit === 'open' ? toIso(state.openedUntil) : undefined,
  };
}

export function getAIProviderStatusSnapshot(modelOverride?: string): AIProviderStatus[] {
  try {
    return getAIConfigs(modelOverride).map(configToStatus);
  } catch {
    return [];
  }
}

export async function probeAIProviders(modelOverride?: string): Promise<AIProviderStatus[]> {
  let configs: ClientConfig[];

  try {
    configs = getAIConfigs(modelOverride);
  } catch {
    return [];
  }

  await Promise.all(configs.map(async (config) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(getAIRequestTimeoutMs(), 10_000));

    try {
      const response = await fetch(getModelsUrl(config), {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new AIClientError(classifyStatus(response.status), 'AI provider health check failed', response.status, config);
      }

      recordSuccess(config);
    } catch (error) {
      recordFailure(config, sanitizeError(error, config));
    } finally {
      clearTimeout(timeoutId);
    }
  }));

  return configs.map(configToStatus);
}

export function toSafeAIError(error: unknown, fallbackType: AIErrorType = 'unknown') {
  if (error instanceof AIClientError) {
    return error;
  }

  return new AIClientError(fallbackType, 'AI provider request failed');
}

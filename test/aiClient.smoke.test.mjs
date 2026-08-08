// AILINES AI — aiClient 纯逻辑冒烟测试（零依赖，Node 24 原生 type-stripping + node:test）
// 覆盖：provider 顺序、错误分类、fallback 链、circuit breaker、400 去 response_format 重试、
//       失败时以 AIClientError 拒绝（API 层只有成功路径才 incrementUsage，即“失败不扣额度”契约）。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AIClientError,
  createChatCompletion,
  getAIProviderStatusSnapshot,
  getAIRequestTimeoutMs,
  toSafeAIError,
} from '../lib/ai/aiClient.ts';

let portCounter = 2000;

function uniqueBases() {
  portCounter += 1;
  const base = `http://127.0.0.1:${portCounter}`;
  return {
    primary: `${base}/v1`,
    fallback: `${base}/v1`,
    secondary: `${base}/v1`,
  };
}

const ENV_KEYS = [
  'AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_PROVIDER',
  'AI_BASE_URL_FALLBACK', 'AI_API_KEY_FALLBACK', 'AI_MODEL_FALLBACK', 'AI_PROVIDER_FALLBACK',
  'AI_BASE_URL_SECONDARY', 'AI_API_KEY_SECONDARY', 'AI_MODEL_SECONDARY', 'AI_PROVIDER_SECONDARY',
  'AI_TIMEOUT_MS', 'AI_RETRY_ATTEMPTS', 'AI_RETRY_BACKOFF_MS', 'AI_CIRCUIT_FAILURE_THRESHOLD', 'AI_CIRCUIT_OPEN_MS',
  'OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL',
  'DEEPSEEK_API_KEY', 'AI_DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', 'DEEPSEEK_MODEL',
];

function resetEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function setEnv(bases, { primary = true, fallback = false, secondary = false, timeout } = {}) {
  if (primary) {
    process.env.AI_BASE_URL = bases.primary;
    process.env.AI_API_KEY = 'pk-test';
    process.env.AI_MODEL = 'gpt-test';
  }
  if (fallback) {
    process.env.AI_BASE_URL_FALLBACK = bases.fallback;
    process.env.AI_API_KEY_FALLBACK = 'fk-test';
    process.env.AI_MODEL_FALLBACK = 'deepseek-test';
    process.env.AI_PROVIDER_FALLBACK = 'deepseek';
  }
  if (secondary) {
    process.env.AI_BASE_URL_SECONDARY = bases.secondary;
    process.env.AI_API_KEY_SECONDARY = 'sk-test';
    process.env.AI_MODEL_SECONDARY = 'gpt-test-2';
    process.env.AI_PROVIDER_SECONDARY = 'tokenapis';
  }
  if (timeout !== undefined) process.env.AI_TIMEOUT_MS = String(timeout);
}

function mockChatResponse(content) {
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installFetch(handler) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const record = {
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : null,
      init,
    };
    calls.push(record);
    return handler(record, calls.length);
  };
  return { calls, restore: () => { globalThis.fetch = originalFetch; } };
}

test('getAIRequestTimeoutMs: default / env override / invalid env', () => {
  resetEnv();
  assert.equal(getAIRequestTimeoutMs(), 35_000);
  process.env.AI_TIMEOUT_MS = '12345';
  assert.equal(getAIRequestTimeoutMs(), 12_345);
  process.env.AI_TIMEOUT_MS = 'not-a-number';
  assert.equal(getAIRequestTimeoutMs(), 35_000);
  process.env.AI_TIMEOUT_MS = '-5';
  assert.equal(getAIRequestTimeoutMs(), 35_000);
  assert.equal(getAIRequestTimeoutMs(9_999), 9_999);
  resetEnv();
});

test('provider config order: primary -> fallback -> secondary; no apiKey leaked in status', () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true, fallback: true, secondary: true });
  const statuses = getAIProviderStatusSnapshot();
  assert.equal(statuses.length, 3);
  assert.deepEqual(statuses.map((item) => item.role), ['primary', 'fallback', 'secondary']);
  assert.deepEqual(statuses.map((item) => item.priority), [10, 90, 95]);
  for (const status of statuses) {
    assert.ok(!('apiKey' in status), 'status must never expose apiKey');
    assert.equal(status.healthy, null);
    assert.equal(status.circuit, 'closed');
    assert.ok(status.baseUrl.length > 0);
  }
  resetEnv();
});

test('toSafeAIError: AIClientError passthrough, plain errors -> unknown', () => {
  const typed = new AIClientError('timeout', 'boom');
  assert.equal(toSafeAIError(typed), typed);
  const generic = toSafeAIError(new Error('plain'));
  assert.ok(generic instanceof AIClientError);
  assert.equal(generic.type, 'unknown');
  const fromString = toSafeAIError('oops', 'invalid_response');
  assert.equal(fromString.type, 'invalid_response');
});

test('success path returns assistant content (billing happens only after success)', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true });
  const { calls, restore } = installFetch(() => mockChatResponse('{"ok":true}'));
  try {
    const content = await createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 });
    assert.equal(content, '{"ok":true}');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.model, 'gpt-test');
  } finally {
    restore();
    resetEnv();
  }
});

test('auth_error (401) on primary does NOT fall through to fallback', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true, fallback: true });
  const { calls, restore } = installFetch(() => new Response('{"error":"bad key"}', { status: 401 }));
  try {
    await assert.rejects(
      createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 }),
      (error) => error instanceof AIClientError && error.type === 'auth_error',
    );
    assert.equal(calls.length, 1, 'auth errors must not burn fallback quota');
  } finally {
    restore();
    resetEnv();
  }
});

test('provider 5xx on primary falls back and succeeds on fallback provider', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true, fallback: true });
  const { calls, restore } = installFetch((record) => {
    if (record.url.includes('/v1') && record.body.model === 'gpt-test') {
      return new Response('{"error":"upstream"}', { status: 502 });
    }
    return mockChatResponse('{"from":"fallback"}');
  });
  try {
    const content = await createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 });
    assert.equal(content, '{"from":"fallback"}');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].body.model, 'deepseek-test');
  } finally {
    restore();
    resetEnv();
  }
});

test('response_format is stripped on 400 retry (providers without json mode)', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true });
  const { calls, restore } = installFetch((record, index) => {
    if (index === 1) return new Response('{"error":"response_format unsupported"}', { status: 400 });
    return mockChatResponse('{"ok":true}');
  });
  try {
    const content = await createChatCompletion({
      purpose: 'plan',
      messages: [{ role: 'user', content: 'hi' }],
      responseFormat: 'json_object',
      maxAttempts: 2,
    });
    assert.equal(content, '{"ok":true}');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.response_format.type, 'json_object');
    assert.equal(calls[1].body.response_format, undefined);
  } finally {
    restore();
    resetEnv();
  }
});

test('timeout is classified as timeout and rejects without fallback burn', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true, timeout: 300 });
  const { calls, restore } = installFetch((record) => new Promise((_resolve, reject) => {
    record.init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }));
  try {
    await assert.rejects(
      createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 }),
      (error) => error instanceof AIClientError && error.type === 'timeout',
    );
    assert.equal(calls.length, 1);
  } finally {
    restore();
    resetEnv();
  }
});

test('circuit breaker opens after repeated failures; no further network calls while open', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true });
  const { calls, restore } = installFetch(() => new Response('{"error":"down"}', { status: 503 }));
  try {
    for (let index = 0; index < 3; index += 1) {
      await assert.rejects(
        createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 }),
        (error) => error instanceof AIClientError && error.type === 'provider_5xx',
      );
    }
    // 第 4 次：circuit open，直接拒绝，不再发网络请求
    await assert.rejects(
      createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 }),
      (error) => error instanceof AIClientError && error.type === 'provider_unavailable',
    );
    assert.equal(calls.length, 3, 'open circuit must not trigger new network calls');
  } finally {
    restore();
    resetEnv();
  }
});

test('all-providers-fail rejects with AIClientError (route only bills on success)', async () => {
  resetEnv();
  const bases = uniqueBases();
  setEnv(bases, { primary: true, fallback: true, secondary: true });
  const { calls, restore } = installFetch(() => new Response('{"error":"down"}', { status: 503 }));
  try {
    await assert.rejects(
      createChatCompletion({ purpose: 'ask', messages: [{ role: 'user', content: 'hi' }], maxAttempts: 1 }),
      (error) => error instanceof AIClientError && error.type === 'provider_5xx',
    );
    assert.equal(calls.length, 3, 'each configured provider tried exactly once');
  } finally {
    restore();
    resetEnv();
  }
});

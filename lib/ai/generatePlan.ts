import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import { readCachedPlan, writeCachedPlan } from '@/lib/ai/planCache';
import type { GeneratedPlan, PlanMode } from '@/lib/ai/types';

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;

function getRequestTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_REQUEST_TIMEOUT_MS;
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class GeneratePlanError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GeneratePlanError';
    this.status = status;
  }
}

export async function generatePlanWithAI(goal: string, mode: PlanMode = 'deep'): Promise<GeneratedPlan> {
  const safeGoal = goal.trim();
  const safeMode: PlanMode = mode === 'lite' ? 'lite' : 'deep';

  if (!safeGoal) {
    throw new GeneratePlanError('请提供学习目标', 400);
  }

  const cachedPlan = await readCachedPlan(safeGoal, safeMode);

  if (cachedPlan) {
    console.log(`AI plan cache hit (${safeMode})`);
    return cachedPlan;
  }

  console.log(`AI plan cache miss (${safeMode})`);

  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new GeneratePlanError('AI_API_KEY 未配置', 500);
  }

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeoutMs());

  let completionResponse: Response;
  const requestBody = {
    model,
    messages: createGeneratePlanMessages(safeGoal, safeMode),
    temperature: safeMode === 'lite' ? 0.25 : 0.3,
    max_tokens: safeMode === 'lite' ? 3200 : 6500,
    response_format: { type: 'json_object' },
  };

  try {
    completionResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (completionResponse.status === 400) {
      completionResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...requestBody, response_format: undefined }),
        signal: controller.signal,
        cache: 'no-store',
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GeneratePlanError('AILINES AI 服务响应超时，请稍后重试', 502);
    }

    throw new GeneratePlanError('AILINES AI 服务暂时不可用，请稍后重试', 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!completionResponse.ok) {
    throw new GeneratePlanError('AILINES AI 服务暂时不可用，请稍后重试', 502);
  }

  const completion = (await completionResponse.json()) as ChatCompletionResponse;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new GeneratePlanError('AILINES AI 返回内容格式异常，请稍后重试', 502);
  }

  try {
    const plan = parseAIJson<GeneratedPlan>(content);
    await writeCachedPlan(safeGoal, safeMode, plan);
    return plan;
  } catch {
    throw new GeneratePlanError('AILINES AI 返回内容格式异常，请稍后重试', 502);
  }
}

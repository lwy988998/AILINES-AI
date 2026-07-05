import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { GeneratedPlan } from '@/lib/ai/types';

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 45_000;

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

export async function generatePlanWithAI(goal: string): Promise<GeneratedPlan> {
  const safeGoal = goal.trim();

  if (!safeGoal) {
    throw new GeneratePlanError('请提供学习目标', 400);
  }

  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new GeneratePlanError('AI_API_KEY 未配置', 500);
  }

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let completionResponse: Response;
  const requestBody = {
    model,
    messages: createGeneratePlanMessages(safeGoal),
    temperature: 0.2,
    max_tokens: 1800,
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
      throw new GeneratePlanError('AI 服务响应超时，请稍后重试', 502);
    }

    throw new GeneratePlanError('AI 服务暂时不可用，请稍后重试', 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!completionResponse.ok) {
    throw new GeneratePlanError('AI 服务暂时不可用，请稍后重试', 502);
  }

  const completion = (await completionResponse.json()) as ChatCompletionResponse;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new GeneratePlanError('AI 返回内容格式异常，请稍后重试', 502);
  }

  try {
    return parseAIJson<GeneratedPlan>(content);
  } catch {
    throw new GeneratePlanError('AI 返回内容格式异常，请稍后重试', 502);
  }
}

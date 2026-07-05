import { createAskPromptMessages } from '@/lib/ai/askPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export type GeneratedAskAnswer = {
  title: string;
  steps: string[];
  commands: string[];
  tips: string[];
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class GenerateAskAnswerError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GenerateAskAnswerError';
    this.status = status;
  }
}

function getRequestTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_ASK_TIMEOUT_MS || process.env.AI_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_REQUEST_TIMEOUT_MS;
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidAskAnswer(value: unknown): value is GeneratedAskAnswer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const answer = value as GeneratedAskAnswer;

  return (
    typeof answer.title === 'string' &&
    isStringArray(answer.steps) &&
    isStringArray(answer.commands) &&
    isStringArray(answer.tips)
  );
}

export async function generateAskAnswerWithAI(goal: string, question: string): Promise<GeneratedAskAnswer> {
  const safeGoal = goal.trim() || '学习';
  const safeQuestion = question.trim();

  if (!safeQuestion) {
    throw new GenerateAskAnswerError('请提供问题', 400);
  }

  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new GenerateAskAnswerError('AI_API_KEY 未配置', 500);
  }

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getRequestTimeoutMs());
  const requestBody = {
    model,
    messages: createAskPromptMessages(safeGoal, safeQuestion),
    temperature: 0.3,
    max_tokens: 900,
    response_format: { type: 'json_object' },
  };

  let completionResponse: Response;

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
  } catch {
    throw new GenerateAskAnswerError('AI 问答暂时失败，请稍后重试', 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!completionResponse.ok) {
    throw new GenerateAskAnswerError('AI 问答暂时失败，请稍后重试', 502);
  }

  const completion = (await completionResponse.json()) as ChatCompletionResponse;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new GenerateAskAnswerError('AI 问答暂时失败，请稍后重试', 502);
  }

  try {
    const answer = parseAIJson<GeneratedAskAnswer>(content);

    if (!isValidAskAnswer(answer)) {
      throw new Error('invalid answer');
    }

    return answer;
  } catch {
    throw new GenerateAskAnswerError('AI 问答暂时失败，请稍后重试', 502);
  }
}

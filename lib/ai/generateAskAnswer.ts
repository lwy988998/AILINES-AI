import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { createAskPromptMessages } from '@/lib/ai/askPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { PlanMode } from '@/lib/ai/types';

const DEFAULT_ASK_TIMEOUT_MS = 25_000;

export type GeneratedAskAnswer = {
  title: string;
  steps: string[];
  commands: string[];
  tips: string[];
};

export class GenerateAskAnswerError extends Error {
  status: number;
  type: string;

  constructor(message: string, status = 502, type = 'unknown') {
    super(message);
    this.name = 'GenerateAskAnswerError';
    this.status = status;
    this.type = type;
  }
}

function getAskTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_ASK_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : getAIRequestTimeoutMs(DEFAULT_ASK_TIMEOUT_MS);
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

function toAskError(error: unknown) {
  const safeError = toSafeAIError(error);
  const status = safeError.type === 'missing_config' || safeError.type === 'auth_error' ? 503 : 502;
  return new GenerateAskAnswerError('AILINES AI 问答暂时不可用，已展示基础示例回答。', status, safeError.type);
}

export async function generateAskAnswerWithAI(goal: string, question: string, mode: PlanMode = 'deep'): Promise<GeneratedAskAnswer> {
  const safeGoal = goal.trim() || '学习';
  const safeQuestion = question.trim();
  const safeMode: PlanMode = mode === 'lite' ? 'lite' : 'deep';

  if (!safeQuestion) {
    throw new GenerateAskAnswerError('请提供问题', 400, 'invalid_request');
  }

  try {
    const content = await createChatCompletion({
      purpose: 'ask',
      messages: createAskPromptMessages(safeGoal, safeQuestion, safeMode),
      temperature: safeMode === 'lite' ? 0.25 : 0.3,
      maxTokens: safeMode === 'lite' ? 700 : 1100,
      responseFormat: 'json_object',
      timeoutMs: getAskTimeoutMs(),
    });

    const answer = parseAIJson<GeneratedAskAnswer>(content);

    if (!isValidAskAnswer(answer)) {
      throw new AIClientError('invalid_response', 'AI answer schema invalid');
    }

    return answer;
  } catch (error) {
    const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI ask fallback', {
      errorType: safeError.type,
      status: safeError.status,
      mode: safeMode,
      questionLength: safeQuestion.length,
    });
    throw toAskError(safeError);
  }
}

import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { createRegenerationPromptSuffix, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { readCachedPlan, writeCachedPlan } from '@/lib/ai/planCache';
import type { GeneratedPlan, PlanMode } from '@/lib/ai/types';

const DEFAULT_PLAN_TIMEOUT_MS = 35_000;

export class GeneratePlanError extends Error {
  status: number;
  type: string;

  constructor(message: string, status = 502, type = 'unknown') {
    super(message);
    this.name = 'GeneratePlanError';
    this.status = status;
    this.type = type;
  }
}

function toGeneratePlanError(error: unknown) {
  const safeError = toSafeAIError(error);
  const status = safeError.type === 'missing_config' ? 503 : safeError.type === 'auth_error' ? 503 : 502;
  return new GeneratePlanError('生成未完成，已为你准备可继续学习的课程结构。', status, safeError.type);
}

export async function generatePlanWithAI(goal: string, mode: PlanMode = 'deep'): Promise<GeneratedPlan> {
  const safeGoal = goal.trim();
  const safeMode: PlanMode = mode === 'lite' ? 'lite' : 'deep';

  if (!safeGoal) {
    throw new GeneratePlanError('请提供学习目标', 400, 'invalid_request');
  }

  const cachedPlan = await readCachedPlan(safeGoal, safeMode);

  if (cachedPlan) {
    const cachedValidation = validateUserVisibleCourseContent(adaptGeneratedPlan(cachedPlan, safeMode), { goal: safeGoal, mode: safeMode });
    if (cachedValidation.valid) {
      console.log(`AI plan cache hit (${safeMode})`);
      return cachedPlan;
    }
    console.log(`AI plan cache rejected by quality gate (${safeMode})`, cachedValidation.reasons);
  }

  console.log(`AI plan cache miss (${safeMode})`);

  try {
    let lastValidation: ReturnType<typeof validateUserVisibleCourseContent> | null = null;
    for (let attempt = 0; attempt < (safeMode === 'deep' ? 2 : 1); attempt += 1) {
      const messages = attempt === 0
        ? createGeneratePlanMessages(safeGoal, safeMode)
        : createGeneratePlanMessages(`${safeGoal}${lastValidation ? createRegenerationPromptSuffix(lastValidation) : ''}`, safeMode);
      const content = await createChatCompletion({
        purpose: 'plan',
        messages,
        temperature: safeMode === 'lite' ? 0.25 : 0.3,
        maxTokens: safeMode === 'lite' ? 3200 : 6500,
        responseFormat: 'json_object',
        timeoutMs: getAIRequestTimeoutMs(DEFAULT_PLAN_TIMEOUT_MS),
      });

      const plan = parseAIJson<GeneratedPlan>(content);
      const validation = validateUserVisibleCourseContent(adaptGeneratedPlan(plan, safeMode), { goal: safeGoal, mode: safeMode });
      if (validation.valid) {
        await writeCachedPlan(safeGoal, safeMode, plan);
        return plan;
      }
      lastValidation = validation;
      console.warn('AI plan quality retry', { mode: safeMode, attempt: attempt + 1, reasons: validation.reasons, score: validation.score });
    }
    throw new AIClientError('invalid_response', 'AI plan quality gate failed');
  } catch (error) {
    const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI plan generation fallback', {
      errorType: safeError.type,
      status: safeError.status,
      mode: safeMode,
      goalLength: safeGoal.length,
    });
    throw toGeneratePlanError(safeError);
  }
}

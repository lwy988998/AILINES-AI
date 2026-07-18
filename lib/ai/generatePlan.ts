import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { createRegenerationPromptSuffix, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { readCachedPlan, writeCachedPlan } from '@/lib/ai/planCache';
import { markCourseContentSource, summarizeCourseContentSources } from '@/lib/courseContentSource';
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

export async function generatePlanWithAI(goal: string, mode: PlanMode = 'deep', options: { bypassCache?: boolean } = {}): Promise<GeneratedPlan> {
  const safeGoal = goal.trim();
  const safeMode: PlanMode = mode === 'lite' ? 'lite' : 'deep';

  if (!safeGoal) {
    throw new GeneratePlanError('请提供学习目标', 400, 'invalid_request');
  }

  const cachedPlan = options.bypassCache ? null : await readCachedPlan(safeGoal, safeMode);

  if (cachedPlan) {
    const taggedCachedPlan = markCourseContentSource(cachedPlan, 'legacy-ai');
    const rawCachedValidation = validateUserVisibleCourseContent(taggedCachedPlan, { goal: safeGoal, mode: safeMode });
    const adaptedCachedValidation = rawCachedValidation.valid
      ? validateUserVisibleCourseContent(adaptGeneratedPlan(taggedCachedPlan, safeMode), { goal: safeGoal, mode: safeMode })
      : rawCachedValidation;
    if (rawCachedValidation.valid && adaptedCachedValidation.valid) {
      console.log('AI plan cache hit', { mode: safeMode, rawAIValid: true, qualityValid: true, retryCount: 0, finalSourceSummary: summarizeCourseContentSources(taggedCachedPlan) });
      return taggedCachedPlan;
    }
    console.log(`AI plan cache rejected by quality gate (${safeMode})`, adaptedCachedValidation.reasons);
  }

  console.log(options.bypassCache ? `AI plan cache bypass (${safeMode})` : `AI plan cache miss (${safeMode})`);

  try {
    let lastValidation: ReturnType<typeof validateUserVisibleCourseContent> | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
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

      const plan = markCourseContentSource(parseAIJson<GeneratedPlan>(content), 'ai');
      const rawValidation = validateUserVisibleCourseContent(plan, { goal: safeGoal, mode: safeMode });
      const adaptedValidation = rawValidation.valid
        ? validateUserVisibleCourseContent(adaptGeneratedPlan(plan, safeMode), { goal: safeGoal, mode: safeMode })
        : rawValidation;
      if (rawValidation.valid && adaptedValidation.valid) {
        await writeCachedPlan(safeGoal, safeMode, plan);
        console.log('AI plan quality accepted', { mode: safeMode, retryCount: attempt, rawAIValid: rawValidation.valid, qualityValid: adaptedValidation.valid, finalSourceSummary: summarizeCourseContentSources(plan) });
        return plan;
      }
      lastValidation = adaptedValidation.valid ? rawValidation : adaptedValidation;
      console.warn('AI plan quality retry', { mode: safeMode, attempt: attempt + 1, reasons: lastValidation.reasons, score: lastValidation.score });
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

import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { createRegenerationPromptSuffix, summarizeCourseQualityIssues, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { readCachedPlan, writeCachedPlan } from '@/lib/ai/planCache';
import { markCourseContentSource, summarizeCourseContentSources } from '@/lib/courseContentSource';
import type { GeneratedPlan, PlanMode } from '@/lib/ai/types';

const PLAN_ATTEMPT_TIMEOUT_MS: Record<PlanMode, number> = { lite: 45_000, deep: 55_000 };
const PLAN_TOTAL_TIMEOUT_MS: Record<PlanMode, number> = { lite: 95_000, deep: 120_000 };


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
  const status = safeError.type === 'missing_config' ? 503 : safeError.type === 'auth_error' ? 503 : safeError.type === 'timeout' ? 504 : 502;
  return new GeneratePlanError('课程内容暂未生成完成，请稍后重试。', status, safeError.type);
}

function createTimeoutError() {
  return new AIClientError('timeout', 'Course generation timed out');
}

async function withHardTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(createTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getPlanAttemptTimeoutMs(mode: PlanMode) {
  return Math.min(getAIRequestTimeoutMs(PLAN_ATTEMPT_TIMEOUT_MS[mode]), PLAN_ATTEMPT_TIMEOUT_MS[mode]);
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
    return await withHardTimeout((async () => {
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
          timeoutMs: getPlanAttemptTimeoutMs(safeMode),
          maxAttempts: 1,
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
        console.warn('AI plan quality retry', { mode: safeMode, attempt: attempt + 1, reasons: lastValidation.reasons, score: lastValidation.score, issueSummary: summarizeCourseQualityIssues(plan), sourceSummary: summarizeCourseContentSources(plan) });
      }
      throw new AIClientError('invalid_response', 'AI plan quality gate failed');
    })(), PLAN_TOTAL_TIMEOUT_MS[safeMode]);
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

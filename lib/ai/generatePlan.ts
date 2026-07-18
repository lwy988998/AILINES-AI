import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { createGeneratePlanMessages, createRepairPlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { createRegenerationPromptSuffix, summarizeCourseQualityIssues, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { readCachedPlan, writeCachedPlan } from '@/lib/ai/planCache';
import { markCourseContentSource, summarizeCourseContentSources } from '@/lib/courseContentSource';
import type { GeneratedPlan, PlanMode } from '@/lib/ai/types';

const PLAN_ATTEMPT_TIMEOUT_MS: Record<PlanMode, number> = { lite: 75_000, deep: 80_000 };
const PLAN_TOTAL_TIMEOUT_MS: Record<PlanMode, number> = { lite: 170_000, deep: 190_000 };


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

function safeGoalHash(goal: string) {
  let hash = 0;
  for (let index = 0; index < goal.length; index += 1) hash = ((hash << 5) - hash + goal.charCodeAt(index)) | 0;
  return Math.abs(hash).toString(16);
}

function summarizeValidation(validation: ReturnType<typeof validateUserVisibleCourseContent>) {
  return {
    fatalReasons: validation.fatalReasons,
    moduleReasons: validation.moduleReasons,
    warnings: validation.warnings,
    fieldPaths: validation.fieldPaths.slice(0, 12),
    score: validation.score,
  };
}

function truncateForRepair(content: string) {
  const limit = 22_000;
  return content.length > limit ? content.slice(0, limit) : content;
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
      let lastPlan: GeneratedPlan | null = null;
      let lastRawContent = '';
      let rawAIValid = false;
      let adaptedValid = false;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const messages = attempt === 0
          ? createGeneratePlanMessages(safeGoal, safeMode)
          : createGeneratePlanMessages(`
${safeGoal}${lastValidation ? createRegenerationPromptSuffix(lastValidation) : ''}`, safeMode);
        const content = await createChatCompletion({
          purpose: 'plan',
          messages,
          temperature: safeMode === 'lite' ? 0.25 : 0.3,
          maxTokens: safeMode === 'lite' ? 2600 : 3200,
          responseFormat: 'json_object',
          timeoutMs: getPlanAttemptTimeoutMs(safeMode),
          maxAttempts: 1,
        });

        lastRawContent = content;
        const plan = markCourseContentSource(parseAIJson<GeneratedPlan>(content), 'ai');
        lastPlan = plan;
        const rawValidation = validateUserVisibleCourseContent(plan, { goal: safeGoal, mode: safeMode });
        const adaptedPlan = adaptGeneratedPlan(plan, safeMode);
        const adaptedValidation = validateUserVisibleCourseContent(adaptedPlan, { goal: safeGoal, mode: safeMode });
        rawAIValid = rawValidation.valid;
        adaptedValid = adaptedValidation.valid;
        if (rawValidation.valid && adaptedValidation.valid) {
          await writeCachedPlan(safeGoal, safeMode, plan);
          console.log('AI plan quality accepted', { mode: safeMode, goalHash: safeGoalHash(safeGoal), providerCalled: true, rawAIValid, adaptedValid, qualityValid: true, retryCount: attempt, repairAttempted: false, repairValid: false, finalSourceSummary: summarizeCourseContentSources(plan) });
          return plan;
        }
        lastValidation = adaptedValidation.valid ? rawValidation : adaptedValidation;
        console.warn('AI plan quality retry', { mode: safeMode, goalHash: safeGoalHash(safeGoal), attempt: attempt + 1, rawAIValid, adaptedValid, qualityValid: false, ...summarizeValidation(lastValidation), issueSummary: summarizeCourseQualityIssues(plan), sourceSummary: summarizeCourseContentSources(plan) });
      }

      if (lastValidation && (lastPlan || lastRawContent)) {
        const previousJsonText = truncateForRepair(lastPlan ? JSON.stringify(lastPlan) : lastRawContent);
        const repairContent = await createChatCompletion({
          purpose: 'plan',
          messages: createRepairPlanMessages({
            goal: safeGoal,
            mode: safeMode,
            previousJsonText,
            failureSummary: JSON.stringify(summarizeValidation(lastValidation)),
          }),
          temperature: 0.15,
          maxTokens: safeMode === 'lite' ? 2600 : 3200,
          responseFormat: 'json_object',
          timeoutMs: getPlanAttemptTimeoutMs(safeMode),
          maxAttempts: 1,
        });
        const repairedPlan = markCourseContentSource(parseAIJson<GeneratedPlan>(repairContent), 'ai');
        const repairedRawValidation = validateUserVisibleCourseContent(repairedPlan, { goal: safeGoal, mode: safeMode });
        const repairedAdaptedPlan = adaptGeneratedPlan(repairedPlan, safeMode);
        const repairedAdaptedValidation = validateUserVisibleCourseContent(repairedAdaptedPlan, { goal: safeGoal, mode: safeMode });
        const repairValid = repairedRawValidation.valid && repairedAdaptedValidation.valid;
        console.warn('AI plan repair result', { mode: safeMode, goalHash: safeGoalHash(safeGoal), providerCalled: true, rawAIValid: repairedRawValidation.valid, adaptedValid: repairedAdaptedValidation.valid, qualityValid: repairValid, repairAttempted: true, repairValid, ...(repairValid ? {} : summarizeValidation(repairedAdaptedValidation.valid ? repairedRawValidation : repairedAdaptedValidation)) });
        if (repairValid) {
          await writeCachedPlan(safeGoal, safeMode, repairedPlan);
          return repairedPlan;
        }
      }

      throw new AIClientError('invalid_response', 'AI plan quality gate failed');
    })(), PLAN_TOTAL_TIMEOUT_MS[safeMode]);
  } catch (error) {
    const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI plan generation failed', {
      errorType: safeError.type,
      status: safeError.status,
      mode: safeMode,
      goalHash: safeGoalHash(safeGoal),
      providerCalled: safeError.type !== 'missing_config',
    });
    throw toGeneratePlanError(safeError);
  }
}

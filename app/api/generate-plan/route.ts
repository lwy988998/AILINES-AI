import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { canUseFeature } from '@/lib/membership/permissions';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') || request.headers.get('x-vercel-id') || undefined;
}

function mapGenerationFailure(type: string) {
  if (type === 'timeout') {
    return { code: 'COURSE_GENERATION_TIMEOUT', message: '生成超时，请稍后重试。' };
  }
  if (type === 'auth_error') {
    return { code: 'AI_AUTH_FAILED', message: '当前模型接口认证失败，请检查服务配置。' };
  }
  if (type === 'rate_limited') {
    return { code: 'AI_RATE_LIMITED', message: 'AI 服务请求过于频繁，请稍后重试。' };
  }
  if (type === 'invalid_response' || type === 'json_parse_error' || type === 'quality_rejected') {
    return { code: 'COURSE_QUALITY_REJECTED', message: '生成内容未通过质量检查，请重新生成。' };
  }
  if (type === 'missing_config') {
    return { code: 'AI_PROVIDER_MISSING_CONFIG', message: '当前模型接口尚未配置，请检查服务配置。' };
  }
  return { code: 'COURSE_GENERATION_UNAVAILABLE', message: 'AI 服务暂时不可用，请稍后重试。' };
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标。' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';
  const rawMode = typeof body === 'object' && body !== null && 'mode' in body ? String(body.mode).trim() : 'deep';
  const anonymousId = typeof body === 'object' && body !== null && 'anonymousId' in body ? String(body.anonymousId).trim() : undefined;
  const bypassCache = typeof body === 'object' && body !== null && ('bypassCache' in body || 'forcePlan' in body || 'retry' in body)
    ? Boolean((body as Record<string, unknown>).bypassCache) || (body as Record<string, unknown>).forcePlan === 1 || (body as Record<string, unknown>).forcePlan === '1' || Boolean((body as Record<string, unknown>).retry)
    : false;
  const mode: PlanMode = rawMode === 'lite' ? 'lite' : 'deep';

  if (!goal) {
    return NextResponse.json({ error: '请提供学习目标。' }, { status: 400 });
  }

  const user = await getCurrentUserFromRequest(request);
  if (mode === 'deep') {
    const access = canUseFeature({ tier: user?.membershipTier, status: user?.membershipStatus, expiresAt: user?.membershipExpiresAt }, 'deep_plan');
    if (!access.allowed) {
      return NextResponse.json({
        error: access.reason || '深度 AILINES AI 规划是 Pro 功能。你可以升级会员，或先使用快速规划。',
        requiredTier: access.requiredTier || 'pro',
        feature: 'deep_plan',
      }, { status: 403 });
    }
  }

  const usage = await checkUsageLimit({ userId: user?.id, anonymousId, tier: user?.membershipTier, type: 'course_generate' });
  if (!usage.allowed) {
    return NextResponse.json({ error: '今日课程生成次数已用完，升级会员可获得更多额度。', usage }, { status: 429 });
  }

  try {
    const plan = await generatePlanWithAI(goal, mode, { bypassCache });
    await incrementUsage('course_generate', usage.scope);
    return NextResponse.json({ plan, usage: { ...usage, used: usage.used + 1, remaining: Math.max(usage.remaining - 1, 0) } });
  } catch (error) {
    const type = error instanceof GeneratePlanError ? error.type : 'unknown';
    const status = error instanceof GeneratePlanError ? error.status : 502;
    const failure = mapGenerationFailure(type);
    console.warn(`Generate plan API unavailable ${JSON.stringify({
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'unknown error',
      code: failure.code,
      status,
      errorType: type,
      route: 'POST /api/generate-plan',
      requestId,
      mode,
      goalLength: goal.length,
      providerCalled: type !== 'missing_config',
      bypassCache,
    })}`);
    return NextResponse.json({
      ok: false,
      code: failure.code,
      error: failure.code,
      message: failure.message,
      canRetry: true,
      usage,
    }, { status });
  }
}

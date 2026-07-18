import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { canUseFeature } from '@/lib/membership/permissions';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';

export async function POST(request: NextRequest) {
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
    const code = type === 'timeout' ? 'COURSE_GENERATION_TIMEOUT' : type === 'invalid_response' ? 'COURSE_QUALITY_REJECTED' : 'COURSE_GENERATION_UNAVAILABLE';
    console.warn('Generate plan API unavailable', { errorType: type, status, mode, goalLength: goal.length, providerCalled: type !== 'missing_config', bypassCache });
    await incrementUsage('course_generate', usage.scope);
    return NextResponse.json({
      ok: false,
      code,
      error: code,
      message: '课程内容暂未生成完成，请重新生成。',
      canRetry: true,
      usage: { ...usage, used: usage.used + 1, remaining: Math.max(usage.remaining - 1, 0) },
    }, { status });
  }
}

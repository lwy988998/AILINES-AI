import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { getMockPlanByGoal } from '@/lib/mockPlan';
import { canUseFeature } from '@/lib/membership/permissions';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';
  const rawMode = typeof body === 'object' && body !== null && 'mode' in body ? String(body.mode).trim() : 'deep';
  const anonymousId = typeof body === 'object' && body !== null && 'anonymousId' in body ? String(body.anonymousId).trim() : undefined;
  const mode: PlanMode = rawMode === 'lite' ? 'lite' : 'deep';

  if (!goal) {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const user = await getCurrentUserFromRequest(request);
  if (mode === 'deep') {
    const access = canUseFeature(user?.membershipTier, 'deep_plan');
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
    const plan = await generatePlanWithAI(goal, mode);
    await incrementUsage('course_generate', usage.scope);
    return NextResponse.json({ plan, source: 'ai', usage: { ...usage, used: usage.used + 1, remaining: Math.max(usage.remaining - 1, 0) } });
  } catch (error) {
    const type = error instanceof GeneratePlanError ? error.type : 'unknown';
    console.warn('Generate plan API fallback', { errorType: type, mode, goalLength: goal.length });
    await incrementUsage('course_generate', usage.scope);
    return NextResponse.json({
      plan: getMockPlanByGoal(goal, mode),
      source: 'fallback',
      message: '已为你生成课程结构。你可以稍后重新生成，获取另一版方案。',
      usage: { ...usage, used: usage.used + 1, remaining: Math.max(usage.remaining - 1, 0) },
    });
  }
}

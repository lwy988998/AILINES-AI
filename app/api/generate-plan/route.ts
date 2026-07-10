import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getMockPlanByGoal } from '@/lib/mockPlan';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';
  const rawMode = typeof body === 'object' && body !== null && 'mode' in body ? String(body.mode).trim() : 'deep';
  const mode: PlanMode = rawMode === 'lite' ? 'lite' : 'deep';

  if (!goal) {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  try {
    const plan = await generatePlanWithAI(goal, mode);
    return NextResponse.json({ plan, source: 'ai' });
  } catch (error) {
    const type = error instanceof GeneratePlanError ? error.type : 'unknown';
    console.warn('Generate plan API fallback', { errorType: type, mode, goalLength: goal.length });
    return NextResponse.json({
      plan: getMockPlanByGoal(goal, mode),
      source: 'fallback',
      message: 'AILINES AI 生成暂时不可用，已为你展示基础课程版本。',
    });
  }
}

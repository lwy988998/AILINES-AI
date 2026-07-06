import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';

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

  try {
    const plan = await generatePlanWithAI(goal, mode);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof GeneratePlanError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'AILINES AI 服务暂时不可用，请稍后重试' }, { status: 502 });
  }
}

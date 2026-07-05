import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanError, generatePlanWithAI } from '@/lib/ai/generatePlan';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';

  try {
    const plan = await generatePlanWithAI(goal);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof GeneratePlanError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 502 });
  }
}

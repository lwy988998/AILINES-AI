import { NextRequest, NextResponse } from 'next/server';
import { GenerateAskAnswerError, generateAskAnswerWithAI } from '@/lib/ai/generateAskAnswer';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供问题' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '学习';
  const question = typeof body === 'object' && body !== null && 'question' in body ? String(body.question).trim() : '';

  try {
    const answer = await generateAskAnswerWithAI(goal, question);
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof GenerateAskAnswerError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'AILINES AI 问答暂时失败，请稍后重试' }, { status: 502 });
  }
}

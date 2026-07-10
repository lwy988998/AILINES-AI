import { NextRequest, NextResponse } from 'next/server';
import { GenerateAskAnswerError, generateAskAnswerWithAI } from '@/lib/ai/generateAskAnswer';
import type { PlanMode } from '@/lib/ai/types';
import { getMockAnswer } from '@/lib/mockAnswers';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供问题' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '学习';
  const question = typeof body === 'object' && body !== null && 'question' in body ? String(body.question).trim() : '';
  const rawMode = typeof body === 'object' && body !== null && 'mode' in body ? String(body.mode).trim() : 'deep';
  const mode: PlanMode = rawMode === 'lite' ? 'lite' : 'deep';

  if (!question) {
    return NextResponse.json({ error: '请提供问题' }, { status: 400 });
  }

  try {
    const answer = await generateAskAnswerWithAI(goal, question, mode);
    return NextResponse.json({ answer, source: 'ai' });
  } catch (error) {
    const type = error instanceof GenerateAskAnswerError ? error.type : 'unknown';
    console.warn('Ask API fallback', { errorType: type, mode, questionLength: question.length });
    return NextResponse.json({
      answer: getMockAnswer(question),
      source: 'fallback',
      message: 'AILINES AI 问答暂时不可用，已展示基础示例回答。',
    });
  }
}

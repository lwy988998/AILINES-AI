import { NextRequest, NextResponse } from 'next/server';
import { createGeneratePlanMessages } from '@/lib/ai/generatePlanPrompt';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { GeneratedPlan } from '@/lib/ai/types';

const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';

  if (!goal) {
    return NextResponse.json({ error: '请提供学习目标' }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'AI_API_KEY 未配置' }, { status: 500 });
  }

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;

  let completionResponse: Response;

  try {
    completionResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: createGeneratePlanMessages(goal),
        temperature: 0.4,
      }),
    });
  } catch {
    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 502 });
  }

  if (!completionResponse.ok) {
    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 502 });
  }

  const completion = (await completionResponse.json()) as ChatCompletionResponse;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: 'AI 返回内容格式异常，请稍后重试' }, { status: 502 });
  }

  try {
    const plan = parseAIJson<GeneratedPlan>(content);
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: 'AI 返回内容格式异常，请稍后重试' }, { status: 502 });
  }
}

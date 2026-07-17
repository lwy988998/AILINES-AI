import { NextRequest, NextResponse } from 'next/server';
import { ResourceSearchError, searchResources } from '@/lib/search/searchResources';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请提供学习目标。' }, { status: 400 });
  }

  const goal = typeof body === 'object' && body !== null && 'goal' in body ? String(body.goal).trim() : '';

  try {
    const result = await searchResources(goal);
    const { provider: _provider, fallbackUsed: _fallbackUsed, ...safeResult } = result;
    return NextResponse.json(safeResult);
  } catch (error) {
    if (error instanceof ResourceSearchError) {
      return NextResponse.json({ error: error.status === 400 ? '请提供学习目标。' : '资料搜索未完成，请稍后重试。' }, { status: error.status });
    }

    return NextResponse.json({ error: '资料搜索未完成，请稍后重试。' }, { status: 502 });
  }
}

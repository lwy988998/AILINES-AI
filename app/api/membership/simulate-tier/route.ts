import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: '模拟开通功能已关闭。' }, { status: 403 });
}

export async function GET() {
  return NextResponse.json({ error: '模拟开通功能已关闭。' }, { status: 403 });
}

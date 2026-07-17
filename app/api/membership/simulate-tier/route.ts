import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: '会员开通请联系管理员。' }, { status: 403 });
}

export async function GET() {
  return NextResponse.json({ error: '会员开通请联系管理员。' }, { status: 403 });
}

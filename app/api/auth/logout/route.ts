import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, deleteSession, getSessionTokenFromRequest } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  await deleteSession(getSessionTokenFromRequest(request));
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

import { createHash, randomBytes } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const SESSION_COOKIE_NAME = 'ailines_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt();

  await prisma.userSession.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { token, tokenHash, expiresAt, maxAge: SESSION_MAX_AGE_SECONDS };
}

export async function deleteSession(token?: string | null) {
  if (!token) return;
  await prisma.userSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionTokenFromRequest(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

import { NextRequest, NextResponse } from 'next/server';
import { attachAnonymousDataToUser } from '@/lib/auth/attachAnonymousDataToUser';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

function safeUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '登录未完成，请检查信息后重试。' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  const anonymousId = typeof data.anonymousId === 'string' ? data.anonymousId.trim() : undefined;

  if (!email || !password) return NextResponse.json({ error: '邮箱或密码不正确，请重新输入。' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, passwordHash: true } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: '邮箱或密码不正确，请重新输入。' }, { status: 401 });
    }

    const session = await createSession(user.id);
    const attachResult = await attachAnonymousDataToUser({ anonymousId, userId: user.id });
    const response = NextResponse.json({ ok: true, user: safeUser(user), warning: attachResult.warning });
    setSessionCookie(response, session.token, session.expiresAt, request);
    return response;
  } catch (error) {
    console.warn('login failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: '登录未完成，请稍后重试。' }, { status: 500 });
  }
}

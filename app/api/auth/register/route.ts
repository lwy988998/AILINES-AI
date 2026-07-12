import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { attachAnonymousDataToUser } from '@/lib/auth/attachAnonymousDataToUser';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 80) : null;
  const anonymousId = typeof data.anonymousId === 'string' ? data.anonymousId.trim() : undefined;

  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash: await hashPassword(password) },
      select: { id: true, email: true, name: true },
    });
    const session = await createSession(user.id);
    const attachResult = await attachAnonymousDataToUser({ anonymousId, userId: user.id });
    const response = NextResponse.json({ ok: true, user: safeUser(user), warning: attachResult.warning });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: '该邮箱已注册，请直接登录' }, { status: 409 });
    }
    console.warn('register failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}

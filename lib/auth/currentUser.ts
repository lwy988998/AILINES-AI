import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashSessionToken, SESSION_COOKIE_NAME, getSessionTokenFromRequest } from '@/lib/auth/session';

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
};

async function getUserByToken(token?: string | null): Promise<SafeUser | null> {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserByToken(cookieStore.get(SESSION_COOKIE_NAME)?.value || null);
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  return getUserByToken(getSessionTokenFromRequest(request));
}

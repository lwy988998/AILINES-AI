import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashSessionToken, SESSION_COOKIE_NAME, getSessionTokenFromRequest } from '@/lib/auth/session';

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  membershipTier: string;
  membershipStatus: string;
  membershipStartedAt: string | null;
  membershipExpiresAt: string | null;
};

async function getUserByToken(token?: string | null): Promise<SafeUser | null> {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          membershipTier: true,
          membershipStatus: true,
          membershipStartedAt: true,
          membershipExpiresAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return {
    ...session.user,
    membershipStartedAt: session.user.membershipStartedAt?.toISOString() || null,
    membershipExpiresAt: session.user.membershipExpiresAt?.toISOString() || null,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserByToken(cookieStore.get(SESSION_COOKIE_NAME)?.value || null);
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  return getUserByToken(getSessionTokenFromRequest(request));
}

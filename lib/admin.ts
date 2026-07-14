import type { NextRequest } from 'next/server';
import { getCurrentUser, getCurrentUserFromRequest, type SafeUser } from '@/lib/auth/currentUser';

function getAdminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: Pick<SafeUser, 'email'> | null | undefined) {
  if (!user?.email) return false;
  const adminEmails = getAdminEmailSet();
  if (adminEmails.size === 0) return false;
  return adminEmails.has(user.email.trim().toLowerCase());
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  return isAdminUser(user) ? user : null;
}

export async function getCurrentAdminFromRequest(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  return isAdminUser(user) ? user : null;
}

export async function requireAdminFromRequest(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  return {
    user,
    isAdmin: isAdminUser(user),
    status: user ? 403 : 401,
  };
}

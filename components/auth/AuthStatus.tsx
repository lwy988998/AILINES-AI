'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SafeUser } from '@/lib/auth/currentUser';

export function AuthStatus({ user }: { user: SafeUser | null }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.refresh();
      window.dispatchEvent(new Event('ailines-course-history-updated'));
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return (
      <a href="/login" className="rounded-md px-2.5 py-2 transition hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
        登录
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[11rem] truncate rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 sm:inline-block" title={user.email}>
        {user.name || user.email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-md px-2.5 py-2 transition hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        {isLoggingOut ? '退出中' : '退出'}
      </button>
    </div>
  );
}

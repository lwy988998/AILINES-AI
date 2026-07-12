'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';

function getRedirectTarget() {
  if (typeof window === 'undefined') return '/';
  const value = new URLSearchParams(window.location.search).get('redirect') || '/';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, anonymousId: getOrCreateAnonymousId() }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || '登录失败');
      window.dispatchEvent(new Event('ailines-course-history-updated'));
      router.push(getRedirectTarget());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/8">
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">邮箱</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="password">密码</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? '登录中...' : '登录'}
      </button>
      <p className="text-center text-sm text-slate-500">
        没有账号？ <Link href="/register" className="font-semibold text-sky-700 hover:text-sky-800">注册</Link>
      </p>
    </form>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, anonymousId: getOrCreateAnonymousId() }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || '注册未完成，请检查信息后重试。');
      window.dispatchEvent(new Event('ailines-course-history-updated'));
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册未完成，请检查信息后重试。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/8">
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="name">昵称（可选）</label>
        <input id="name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">邮箱</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="password">密码</label>
        <input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">确认密码</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
      </div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? '注册中…' : '注册'}
      </button>
      <p className="text-center text-sm text-slate-500">
        已有账号？ <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-800">去登录</Link>
      </p>
    </form>
  );
}

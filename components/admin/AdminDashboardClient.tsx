'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MembershipTier } from '@/lib/membership/tiers';

const tiers: MembershipTier[] = ['free', 'pro', 'max'];

type Overview = { totalUsers: number; freeUsers: number; proUsers: number; maxUsers: number; totalCourses: number; recentUsers: number; recentCourses: number };
type AdminUser = { id: string; email: string; name: string | null; tier: MembershipTier; membershipStatus: string; createdAt: string; updatedAt: string; lastActiveAt: string; courseCount: number };
type AdminCourse = { id: string; title: string; goal: string; mode: string; status: string; ownerEmail: string | null; createdAt: string; updatedAt: string; planUrl: string };

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}
function tierLabel(tier: string) { return tier === 'pro' ? 'Pro' : tier === 'max' ? 'Max' : 'Free'; }
function tierClass(tier: string) { return tier === 'max' ? 'bg-purple-100 text-purple-700 ring-purple-200' : tier === 'pro' ? 'bg-sky-100 text-sky-700 ring-sky-200' : 'bg-slate-100 text-slate-700 ring-slate-200'; }
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '请求失败，请稍后重试。');
  return data as T;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const usersUrl = useMemo(() => {
    const params = new URLSearchParams({ pageSize: '100' });
    if (query.trim()) params.set('q', query.trim());
    if (tierFilter) params.set('tier', tierFilter);
    return `/api/admin/users?${params.toString()}`;
  }, [query, tierFilter]);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [overviewData, usersData, coursesData] = await Promise.all([
        fetchJson<{ stats: Overview }>('/api/admin/overview'),
        fetchJson<{ users: AdminUser[] }>(usersUrl),
        fetchJson<{ courses: AdminCourse[] }>('/api/admin/courses?pageSize=100'),
      ]);
      setStats(overviewData.stats); setUsers(usersData.users); setCourses(coursesData.courses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载失败，请稍后重试。');
    } finally { setLoading(false); }
  }, [usersUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  async function updateTier(user: AdminUser, tier: MembershipTier) {
    if (user.tier === tier) return;
    if (!window.confirm(`确定要将 ${user.email} 设置为 ${tierLabel(tier)} 吗？`)) return;
    setSavingUserId(user.id); setNotice(''); setError('');
    try {
      const data = await fetchJson<{ user: AdminUser }>(`/api/admin/users/${encodeURIComponent(user.id)}/tier`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }) });
      setUsers((current) => current.map((item) => (item.id === user.id ? data.user : item)));
      setStats((current) => {
        if (!current) return current;
        const next = { ...current };
        if (user.tier === 'free') next.freeUsers -= 1; if (user.tier === 'pro') next.proUsers -= 1; if (user.tier === 'max') next.maxUsers -= 1;
        if (tier === 'free') next.freeUsers += 1; if (tier === 'pro') next.proUsers += 1; if (tier === 'max') next.maxUsers += 1;
        return next;
      });
      setNotice(`已将 ${user.email} 设置为 ${tierLabel(tier)}。`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : '更新失败，请稍后重试。'); }
    finally { setSavingUserId(null); }
  }

  const statCards = [['总用户数', stats?.totalUsers], ['Free 用户', stats?.freeUsers], ['Pro 用户', stats?.proUsers], ['Max 用户', stats?.maxUsers], ['总课程数', stats?.totalCourses], ['7 天新增课程', stats?.recentCourses]] as const;

  return <div className="space-y-8">
    <section className="stagger-fade grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{statCards.map(([label, value]) => <div key={label} className="interactive-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{loading && value == null ? '…' : value ?? 0}</p></div>)}</section>
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">用户管理</h2><p className="mt-1 text-sm text-slate-500">仅展示必要的用户管理信息。</p></div><div className="flex flex-col gap-2 sm:flex-row"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="按邮箱搜索" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-auto" /><select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-auto"><option value="">全部等级</option>{tiers.map((tier) => <option key={tier} value={tier}>{tierLabel(tier)}</option>)}</select><button onClick={loadData} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white interactive-button transition hover:bg-slate-800">重试/刷新</button></div></div>
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}{error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="hidden overflow-x-auto lg:block"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">邮箱</th><th className="px-4 py-3">名称</th><th className="px-4 py-3">等级</th><th className="px-4 py-3">注册时间</th><th className="px-4 py-3">最近活跃</th><th className="px-4 py-3">课程</th><th className="px-4 py-3">操作</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{users.map((user) => <tr key={user.id} className="transition hover:bg-sky-50/50"><td className="px-4 py-3 font-medium text-slate-900">{user.email}</td><td className="px-4 py-3 text-slate-600">{user.name || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${tierClass(user.tier)}`}>{tierLabel(user.tier)}</span></td><td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td><td className="px-4 py-3 text-slate-600">{formatDate(user.lastActiveAt)}</td><td className="px-4 py-3 text-slate-600">{user.courseCount}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{tiers.map((tier) => <button key={tier} disabled={savingUserId === user.id || user.tier === tier} onClick={() => updateTier(user, tier)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 interactive-button transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-45">{tierLabel(tier)}</button>)}</div></td></tr>)}</tbody></table></div>
      <div className="divide-y divide-slate-100 lg:hidden">{users.map((user) => <div key={user.id} className="min-w-0 space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="break-words font-semibold text-slate-950">{user.email}</p><p className="break-words text-sm text-slate-500">{user.name || '未填写名称'} · {user.courseCount} 门课程</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${tierClass(user.tier)}`}>{tierLabel(user.tier)}</span></div><p className="break-words text-xs text-slate-500">注册：{formatDate(user.createdAt)} · 活跃：{formatDate(user.lastActiveAt)}</p><div className="flex flex-wrap gap-2">{tiers.map((tier) => <button key={tier} disabled={savingUserId === user.id || user.tier === tier} onClick={() => updateTier(user, tier)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-45">设为 {tierLabel(tier)}</button>)}</div></div>)}</div>{!loading && users.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">暂无匹配用户。</p> : null}{loading ? <p className="p-6 text-center text-sm text-slate-500">正在加载用户与统计数据…</p> : null}</div>
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-xl font-semibold text-slate-950">课程管理</h2><p className="mt-1 text-sm text-slate-500">展示最近课程的概要信息。</p></div><div className="grid gap-3 lg:grid-cols-2">{courses.map((course) => <article key={course.id} className="interactive-card min-w-0 rounded-2xl border border-slate-200 p-4 interactive-button transition hover:border-sky-200 hover:bg-sky-50/40"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-base font-semibold text-slate-950">{course.title || course.goal}</h3><p className="mt-1 line-clamp-3 break-words text-sm text-slate-600">{course.goal}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{course.status || 'active'}</span></div><div className="mt-4 grid min-w-0 gap-2 break-words text-xs text-slate-500 sm:grid-cols-2"><p>创建者：{course.ownerEmail || '匿名/未绑定'}</p><p>模式：{course.mode || '—'}</p><p>创建：{formatDate(course.createdAt)}</p><p>更新：{formatDate(course.updatedAt)}</p></div><Link href={course.planUrl} className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 interactive-button transition hover:bg-sky-100">查看课程</Link></article>)}</div>{!loading && courses.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">暂无课程。</p> : null}</section>
  </div>;
}

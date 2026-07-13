'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, LogIn, PlayCircle, Trash2 } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { removeCourseHistoryItem } from '@/lib/courseHistory';

type ApiUser = {
  id: string;
  email: string;
  name: string | null;
};

type ApiCourseItem = {
  id: string;
  goal: string;
  mode: 'lite' | 'deep' | string;
  title: string;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  href: string;
  progress: {
    overallPercent: number;
    completedCount: number;
    totalCount: number;
    lastVisitedUrl: string | null;
    lastPageType: string | null;
    lastPhaseName: string | null;
    lastTopicTitle: string | null;
  };
};

function getModeLabel(mode: string) {
  return mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getLastPosition(course: ApiCourseItem) {
  const progress = course.progress;
  if (progress.lastTopicTitle) return progress.lastPhaseName ? `${progress.lastPhaseName} · ${progress.lastTopicTitle}` : progress.lastTopicTitle;
  if (progress.lastPhaseName) return progress.lastPhaseName;
  if (progress.lastPageType) return progress.lastPageType;
  return '尚未开始学习';
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function MyCoursesClient() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [anonymousId, setAnonymousId] = useState('');
  const [courses, setCourses] = useState<ApiCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasCourses = courses.length > 0;
  const listUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: '50', offset: '0' });
    if (anonymousId) params.set('anonymousId', anonymousId);
    return `/api/courses?${params.toString()}`;
  }, [anonymousId]);

  async function loadCourses(nextAnonymousId: string) {
    setIsLoading(true);
    setError('');
    try {
      const [meResponse, coursesResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch(`/api/courses?limit=50&offset=0${nextAnonymousId ? `&anonymousId=${encodeURIComponent(nextAnonymousId)}` : ''}`, { cache: 'no-store' }),
      ]);

      if (meResponse.ok) {
        const meData = await meResponse.json() as { user?: ApiUser | null };
        setUser(meData.user || null);
      } else {
        setUser(null);
      }

      if (!coursesResponse.ok) throw new Error('课程列表加载失败');
      const coursesData = await coursesResponse.json() as { courses?: ApiCourseItem[] };
      setCourses(Array.isArray(coursesData.courses) ? coursesData.courses : []);
    } catch (loadError) {
      console.warn('Load my courses failed', loadError instanceof Error ? loadError.message : 'unknown');
      setError('我的课堂暂时加载失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const nextAnonymousId = getOrCreateAnonymousId();
    setAnonymousId(nextAnonymousId);
    loadCourses(nextAnonymousId);
  }, []);

  async function handleDelete(course: ApiCourseItem) {
    if (!confirm('确定删除这个课堂吗？该操作会删除课程快照和学习进度。')) return;

    setDeletingId(course.id);
    setError('');
    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(course.id)}${anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : ''}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('delete failed');
      removeCourseHistoryItem(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      window.dispatchEvent(new Event('ailines-course-history-updated'));
    } catch (deleteError) {
      console.warn('Delete course failed', deleteError instanceof Error ? deleteError.message : 'unknown');
      setError('删除失败：只能删除属于当前账号或当前浏览器的课堂。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <p className="text-sm font-semibold text-sky-700">学习进度管理</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">我的课堂</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">继续学习你保存的课程和进度。</p>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            去首页生成课程
          </Link>
        </div>

        {!user ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">登录后可跨设备同步历史课堂和学习进度。当前会展示本浏览器 anonymousId 下的课堂。</p>
            <Link href="/login" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200">
              <LogIn className="h-4 w-4" />
              登录
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            已登录：{user.name || user.email}。这里展示当前账号的全部课堂。
          </div>
        )}
      </section>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      {isLoading ? (
        <section className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm shadow-sky-900/5">
          <Loader2 className="h-5 w-5 animate-spin" />
          正在加载我的课堂
        </section>
      ) : !hasCourses ? (
        <section className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 p-8 text-center">
          <p className="text-xl font-semibold text-slate-950">暂无课堂，去首页生成一个学习课程。</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">生成课程后，这里会集中展示课程、进度和继续学习入口。</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            返回首页
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => {
            const percent = normalizePercent(course.progress?.overallPercent || 0);
            const viewHref = course.href || `/plan?courseId=${encodeURIComponent(course.id)}`;
            const continueHref = course.progress?.lastVisitedUrl || viewHref;
            return (
              <article key={course.id} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sky-700">{getModeLabel(course.mode)}</p>
                    <h2 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight text-slate-950">{course.title || course.goal}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">学习目标：{course.goal}</p>
                    {course.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{course.summary}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(course)}
                    disabled={deletingId === course.id}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                    aria-label="删除课堂"
                  >
                    {deletingId === course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>总进度</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                    <p>完成：{course.progress?.completedCount || 0} / {course.progress?.totalCount || 0}</p>
                    <p>更新时间：{formatDateTime(course.updatedAt)}</p>
                    <p className="sm:col-span-2">最近学习位置：{getLastPosition(course)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href={continueHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
                    <PlayCircle className="h-4 w-4" />
                    继续学习
                  </Link>
                  <Link href={viewHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                    <BookOpen className="h-4 w-4" />
                    查看课程
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="sr-only">课程列表接口：{listUrl}</p>
    </div>
  );
}

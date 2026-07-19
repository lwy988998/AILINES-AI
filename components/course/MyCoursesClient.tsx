'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, Clock3, GraduationCap, Loader2, LogIn, PlayCircle, Plus, RefreshCw, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';

type CourseStatus = 'not_started' | 'learning' | 'completed';

type MyCourseItem = {
  id: string;
  title: string;
  goal: string;
  summary?: string | null;
  mode?: string | null;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string | null;
  lastLearningLabel?: string | null;
  progressPercent: number;
  completedCards: number;
  totalCards: number;
  status: CourseStatus;
  needsRegeneration?: boolean;
  continueUrl: string;
  planUrl: string;
};

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'error';

const statusMeta: Record<CourseStatus, { label: string; className: string }> = {
  not_started: { label: '未开始', className: 'bg-slate-100 text-slate-700' },
  learning: { label: '学习中', className: 'bg-sky-100 text-sky-800' },
  completed: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
};

function getModeLabel(mode?: string | null) {
  if (mode === 'lite') return '快速规划';
  if (mode === 'deep') return '深度 AILINES AI 规划';
  if (mode === 'image') return '生图模式';
  return '';
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateTime(value?: string | null) {
  if (!value) return '暂无记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂无记录';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <AilinesGeneratingState
        type="restore"
        title="正在加载我的课堂"
        subtitle="AILINES AI 正在读取课程列表、学习进度和继续学习入口。"
        steps={["正在读取课程记录", "正在恢复课程进度", "正在准备继续学习入口", "正在整理课堂列表"]}
        compact
        showSkeleton={false}
        estimatedSeconds={6}
      />
      <section className="stagger-fade grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-6">
          <div className="h-4 w-24 animate-pulse rounded-full bg-sky-100" />
          <div className="mt-4 h-7 w-3/4 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 h-2.5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="h-11 animate-pulse rounded-xl bg-sky-100" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
        ))}
      </section>
    </div>
  );
}

export function MyCoursesClient() {
  const [state, setState] = useState<LoadState>('loading');
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setState('loading');
    setError('');

    try {
      const response = await fetch('/api/my-courses', { cache: 'no-store' });
      if (response.status === 401) {
        setCourses([]);
        setState('unauthenticated');
        return;
      }

      if (!response.ok) throw new Error('load failed');
      const data = await response.json() as { courses?: MyCourseItem[] };
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      setState('ready');
    } catch (loadError) {
      console.warn('Load my courses failed', loadError instanceof Error ? loadError.message : 'unknown');
      setError('课程加载失败，请刷新后重试。');
      setState('error');
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const stats = useMemo(() => {
    const total = courses.length;
    const learning = courses.filter((course) => course.status === 'learning').length;
    const completed = courses.filter((course) => course.status === 'completed').length;
    const average = total > 0 ? normalizePercent(courses.reduce((sum, course) => sum + normalizePercent(course.progressPercent), 0) / total) : 0;
    return { total, learning, completed, average };
  }, [courses]);

  async function handleDelete(course: MyCourseItem) {
    const confirmed = window.confirm('确定要删除这门课程吗？删除后该课程的学习记录也会被删除，无法恢复。');
    if (!confirmed) return;

    setDeletingId(course.id);
    setError('');
    try {
      const response = await fetch(`/api/my-courses/${encodeURIComponent(course.id)}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || '课程删除失败，请稍后重试。');
      }
      setCourses((current) => current.filter((item) => item.id !== course.id));
      window.dispatchEvent(new Event('ailines-course-history-updated'));
    } catch (deleteError) {
      console.warn('Delete course failed', deleteError instanceof Error ? deleteError.message : 'unknown');
      setError(deleteError instanceof Error ? deleteError.message : '课程删除失败，请稍后重试。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700"><GraduationCap className="h-4 w-4" />课程中心</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">我的课堂</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">继续你的 AILINES AI 学习旅程，集中管理课程、进度和下一步学习入口。</p>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            <Plus className="h-4 w-4" />
            创建新课程
          </Link>
        </div>
      </section>

      {state === 'unauthenticated' ? (
        <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <LogIn className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">请先登录后查看我的课堂</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">登录后才能查看与你账号关联的课程和学习记录，避免看到其他人的课程。</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
              <LogIn className="h-4 w-4" />登录
            </Link>
            <Link href="/register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <UserPlus className="h-4 w-4" />注册
            </Link>
          </div>
        </section>
      ) : null}

      {state === 'error' ? (
        <section className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">课程加载失败，请刷新后重试。</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error || '暂时无法读取我的课堂。'}</p>
          <button type="button" onClick={loadCourses} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            <RefreshCw className="h-4 w-4" />重试
          </button>
        </section>
      ) : null}

      {state === 'loading' ? <LoadingState /> : null}

      {state === 'ready' && courses.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/70 p-8 text-center animate-soft-pop">
          <Sparkles className="mx-auto h-12 w-12 text-sky-700" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">你还没有创建课程</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">从一个学习目标开始，让 AILINES AI 为你生成课程化学习路线。</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            创建第一门课程
          </Link>
        </section>
      ) : null}

      {state === 'ready' && courses.length > 0 ? (
        <>
          <section className="stagger-fade grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="interactive-card rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <p className="text-sm font-semibold text-slate-500">总课程数</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
            </div>
            <div className="interactive-card rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <p className="text-sm font-semibold text-slate-500">学习中</p>
              <p className="mt-2 text-3xl font-semibold text-sky-700">{stats.learning}</p>
            </div>
            <div className="interactive-card rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <p className="text-sm font-semibold text-slate-500">已完成</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.completed}</p>
            </div>
            <div className="interactive-card rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <p className="text-sm font-semibold text-slate-500">平均进度</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.average}%</p>
            </div>
          </section>

          {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

          <section className="stagger-fade grid gap-4 lg:grid-cols-2">
            {courses.map((course) => {
              const percent = normalizePercent(course.progressPercent);
              const meta = course.needsRegeneration ? { label: '需要重新生成', className: 'bg-amber-100 text-amber-800' } : statusMeta[course.status] || statusMeta.not_started;
              const modeLabel = getModeLabel(course.mode);
              const primaryLabel = course.needsRegeneration ? '重新生成课程' : course.status === 'completed' ? '复习课程' : course.status === 'not_started' ? '开始学习' : '继续学习';
              const primaryHref = course.needsRegeneration ? `/?goal=${encodeURIComponent(course.goal)}&mode=${course.mode === 'lite' ? 'lite' : 'deep'}` : (course.continueUrl || course.planUrl);
              return (
                <article key={course.id} className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-6">
                  <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {modeLabel ? <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">{modeLabel}</span> : null}
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      </div>
                      <h2 className="mt-3 line-clamp-3 break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{course.title || course.goal}</h2>
                      <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{course.summary || course.goal}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(course)}
                      disabled={deletingId === course.id}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 interactive-button transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                      aria-label="删除课程"
                    >
                      {deletingId === course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>学习进度</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-2 text-sm text-slate-500 sm:grid-cols-2">
                      <p className="flex min-w-0 items-center gap-2 break-words"><CheckCircle2 className="h-4 w-4 text-emerald-600" />完成卡片：{course.completedCards} / {course.totalCards}</p>
                      <p className="flex min-w-0 items-center gap-2 break-words"><Clock3 className="h-4 w-4 text-sky-600" />创建：{formatDateTime(course.createdAt)}</p>
                      <p className="break-words sm:col-span-2">最近学习：{course.lastLearningLabel || '暂无学习位置'} · {formatDateTime(course.lastStudiedAt || course.updatedAt)}</p>
                    </div>
                  </div>

                  {course.needsRegeneration ? (
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                      <p className="font-semibold">课程内容未生成完整</p>
                      <p className="mt-1">这门课不会展示假内容。请重新生成后再继续学习。</p>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
                      <PlayCircle className="h-4 w-4" />{primaryLabel}
                    </Link>
                    <Link href={course.planUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                      <BookOpen className="h-4 w-4" />查看课程
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </div>
  );
}

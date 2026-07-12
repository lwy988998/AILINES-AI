'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Home, RefreshCw } from 'lucide-react';
import { CoursePlanView } from '@/components/course/CoursePlanView';
import { getCourseHistory, getCourseSnapshot, touchCourseHistoryItem, type CourseSnapshot } from '@/lib/courseHistory';

function getModeText(mode: 'lite' | 'deep') {
  return mode === 'lite'
    ? { label: '快速规划', description: '从本地快照恢复的轻量学习课程，不会重新生成。' }
    : { label: '深度 AILINES AI 规划', description: '从本地快照恢复的系统学习课程，不会重新调用 AI 生成。' };
}

export function StoredCoursePlan({ courseId }: { courseId: string }) {
  const [snapshot, setSnapshot] = useState<CourseSnapshot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackHref, setFallbackHref] = useState('/');

  useEffect(() => {
    const storedSnapshot = getCourseSnapshot(courseId);
    setSnapshot(storedSnapshot);

    if (storedSnapshot) {
      touchCourseHistoryItem(courseId);
      setFallbackHref(`/plan?goal=${encodeURIComponent(storedSnapshot.goal)}&mode=${storedSnapshot.mode}`);
    } else {
      const historyItem = getCourseHistory().find((item) => item.id === courseId);
      if (historyItem?.goal) {
        setFallbackHref(`/plan?goal=${encodeURIComponent(historyItem.goal)}&mode=${historyItem.mode}`);
      }
    }

    setIsLoaded(true);
  }, [courseId]);

  const modeText = useMemo(() => snapshot ? getModeText(snapshot.mode) : null, [snapshot]);

  if (!isLoaded) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-sky-700" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">正在恢复课堂...</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">正在从本地浏览器读取历史课堂快照，不会重新生成课程。</p>
        </div>
      </div>
    );
  }

  if (!snapshot || !modeText) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
        <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">本地课堂记录已失效</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">没有在当前浏览器找到这个 courseId 对应的课程快照。历史课堂不会悄悄重新生成；如果你需要继续学习，请返回首页或重新生成课程。</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <Link href={fallbackHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
              <RefreshCw className="h-4 w-4" />
              重新生成
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <CoursePlanView
      goal={snapshot.goal}
      mode={snapshot.mode}
      plan={snapshot.plan}
      modeLabel={modeText.label}
      modeDescription={modeText.description}
      resourceSourceMessage="已从本地历史课堂快照恢复资料，不会重新搜索或重新生成。"
      courseId={snapshot.id}
      notice={(
        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" />已恢复历史课堂</p>
            <p className="mt-1 font-medium">本页来自浏览器 localStorage 中保存的课程快照，没有重新调用 AI provider 生成课程。</p>
          </div>
          <Link href={`/progress?goal=${encodeURIComponent(snapshot.goal)}&mode=${snapshot.mode}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
            进入进度追踪
          </Link>
        </section>
      )}
    />
  );
}

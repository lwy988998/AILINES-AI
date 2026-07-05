'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, MessageCircle, PlayCircle, Trash2 } from 'lucide-react';
import { deleteSavedRoute, readSavedRoutes, SavedRoute } from '@/lib/savedRoutesStorage';

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function RoutesClient() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    setRoutes(readSavedRoutes());
  }, []);

  function removeRoute(routeId: string) {
    if (!confirm('确定要删除这条路线吗？')) {
      return;
    }

    setRoutes(deleteSavedRoute(routeId));
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <p className="text-sm font-semibold text-sky-700">本地保存</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">我的路线</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          这里展示你在当前浏览器中保存的学习路线。数据仅保存在本地 localStorage，不会上传到服务器。
        </p>
      </section>

      {routes.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 p-8 text-center">
          <p className="text-xl font-semibold text-slate-950">还没有保存路线</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">先从首页输入学习目标，进入方案页后点击“保存路线”。</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            返回首页创建路线
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {routes.map((route) => (
            <article key={route.id} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-700">{route.goal}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{route.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">保存时间：{formatDate(route.createdAt)}</p>
                  <p className="text-sm leading-6 text-slate-500">更新时间：{formatDate(route.updatedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRoute(route.id)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                  aria-label="删除路线"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Link
                  href={route.planUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <BookOpen className="h-4 w-4" />
                  看方案
                </Link>
                <Link
                  href={route.progressUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
                >
                  <PlayCircle className="h-4 w-4" />
                  进度
                </Link>
                <Link
                  href={route.askUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  问答
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

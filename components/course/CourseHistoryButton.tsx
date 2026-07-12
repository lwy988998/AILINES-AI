'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Trash2, X } from 'lucide-react';
import {
  clearCourseHistory,
  getCourseHistory,
  removeCourseHistoryItem,
  type CourseHistoryItem,
} from '@/lib/courseHistory';

function getModeLabel(mode: CourseHistoryItem['mode']) {
  return mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
}

function formatHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs >= 0 && diffMs < 60 * 1000) {
    return '刚刚';
  }

  const isToday = date.toDateString() === now.toDateString();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return isToday ? `今天 ${hour}:${minute}` : `${year}-${month}-${day} ${hour}:${minute}`;
}

export function CourseHistoryButton() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);

  function refreshHistory() {
    setHistory(getCourseHistory());
  }

  useEffect(() => {
    refreshHistory();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    refreshHistory();

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleStorage() {
      refreshHistory();
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (pathname !== '/') {
    return null;
  }

  function handleRemove(id: string) {
    setHistory(removeCourseHistoryItem(id));
  }

  function handleClear() {
    setHistory(clearCourseHistory());
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        历史课堂
        <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-xl shadow-slate-900/12">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">历史课堂</p>
              <p className="mt-0.5 text-xs text-slate-500">最多保存最近 5 条课程</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="关闭历史课堂"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">暂无历史课堂</div>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-stretch gap-2 rounded-2xl border border-slate-100 bg-white p-2 transition hover:border-sky-200 hover:bg-sky-50/70"
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="min-w-0 flex-1 rounded-xl p-1 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <p className="truncate text-sm font-semibold text-slate-950">{item.title || item.goal}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.goal}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-800">{getModeLabel(item.mode)}</span>
                      {item.legacy ? <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800">旧记录</span> : null}
                      <span className="text-slate-400">{formatHistoryTime(item.updatedAt)}</span>
                    </div>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-2 py-1 pr-1">
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {item.legacy ? '重新生成' : '继续学习'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label={`删除历史课堂 ${item.title || item.goal}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                清空历史
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

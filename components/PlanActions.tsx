'use client';

import { useRouter } from 'next/navigation';
import { Bookmark, PlayCircle } from 'lucide-react';

type PlanActionsProps = {
  goal: string;
};

export function PlanActions({ goal }: PlanActionsProps) {
  const router = useRouter();

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-end sm:p-5">
      <button
        type="button"
        onClick={() => alert('登录后可保存路线')}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <Bookmark className="h-4 w-4" />
        保存路线
      </button>
      <button
        type="button"
        onClick={() => router.push(`/progress?goal=${encodeURIComponent(goal)}`)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <PlayCircle className="h-4 w-4" />
        开始执行
      </button>
    </div>
  );
}

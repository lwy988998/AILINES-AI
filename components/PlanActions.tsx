'use client';

import Link from 'next/link';
import { Bookmark, MessageCircle, PlayCircle } from 'lucide-react';
import { saveRoute } from '@/lib/savedRoutesStorage';

type PlanActionsProps = {
  goal: string;
};

export function PlanActions({ goal }: PlanActionsProps) {
  const encodedGoal = encodeURIComponent(goal);

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-end sm:p-5">
      <button
        type="button"
        onClick={() => {
          const result = saveRoute(goal);
          alert(result.status === 'updated' ? '路线已更新到我的路线' : '已保存到我的路线');
        }}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <Bookmark className="h-4 w-4" />
        保存路线
      </button>
      <Link
        href={`/ask?goal=${encodedGoal}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <MessageCircle className="h-4 w-4" />
        问 AI
      </Link>
      <Link
        href={`/progress?goal=${encodedGoal}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <PlayCircle className="h-4 w-4" />
        开始执行
      </Link>
    </div>
  );
}

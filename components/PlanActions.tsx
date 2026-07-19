'use client';

import Link from 'next/link';
import { Bookmark, MessageCircle, PlayCircle } from 'lucide-react';
import { saveRoute } from '@/lib/savedRoutesStorage';

type PlanActionsProps = {
  goal: string;
  title?: string;
  mode?: 'lite' | 'deep';
  courseId?: string;
  anonymousId?: string;
};

export function PlanActions({ goal, title, mode = 'deep', courseId, anonymousId }: PlanActionsProps) {
  const encodedGoal = encodeURIComponent(goal);
  const encodedMode = encodeURIComponent(mode);
  const courseQuery = `${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ''}${anonymousId ? `&anonymousId=${encodeURIComponent(anonymousId)}` : ''}`;

  return (
    <div className="mobile-button-stack mt-8 flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 md:flex-row md:items-center md:justify-end sm:p-5">
      <button
        type="button"
        onClick={() => {
          const result = saveRoute(goal, title);
          alert(result.status === 'updated' ? '路线已更新到我的路线' : '已保存到我的路线');
        }}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <Bookmark className="h-4 w-4" />
        保存路线
      </button>
      <Link
        href={`/ask?goal=${encodedGoal}&mode=${encodedMode}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
      >
        <MessageCircle className="h-4 w-4" />
        问 AILINES AI
      </Link>
      <Link
        href={`/progress?goal=${encodedGoal}&mode=${encodedMode}${courseQuery}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <PlayCircle className="h-4 w-4" />
        开始执行
      </Link>
    </div>
  );
}

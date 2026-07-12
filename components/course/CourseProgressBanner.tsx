import Link from 'next/link';
import { ArrowRight, MapPin, TrendingUp } from 'lucide-react';
import type { CourseProgressSummary } from '@/lib/course/courseProgressRepository';

type CourseProgressBannerProps = {
  progress: CourseProgressSummary;
};

function getLocationText(progress: CourseProgressSummary) {
  if (progress.lastTopicTitle) return `最近学习：${progress.lastTopicTitle}`;
  if (progress.lastPhaseName) return `最近学习：${progress.lastPhaseName}`;
  if (progress.lastPageType) return `最近访问：${progress.lastPageType}`;
  return '还没有记录最近学习位置';
}

export function CourseProgressBanner({ progress }: CourseProgressBannerProps) {
  const continueHref = progress.lastVisitedUrl || `/progress?courseId=${encodeURIComponent(progress.courseId)}`;

  return (
    <section className="grid gap-4 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-sky-700">
          <TrendingUp className="h-4 w-4" />
          课程进度：{progress.overallPercent}%
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-700" style={{ width: `${progress.overallPercent}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
          <span>已完成 {progress.completedCount} / {progress.totalCount} 项</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-700" />
            {getLocationText(progress)}
          </span>
        </div>
      </div>
      {progress.lastVisitedUrl ? (
        <Link href={continueHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
          继续上次学习
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}

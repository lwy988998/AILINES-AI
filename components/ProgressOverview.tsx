type ProgressOverviewProps = {
  completedCount: number;
  totalCount: number;
  percent: number;
  onReset: () => void;
  syncLabel?: string;
};

function getStatusText(percent: number) {
  if (percent === 0) return '准备开始';
  if (percent < 50) return '学习中';
  if (percent < 100) return '进展不错';
  return '已完成';
}

export function ProgressOverview({ completedCount, totalCount, percent, onReset, syncLabel }: ProgressOverviewProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">进度总览</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="text-5xl font-semibold tracking-tight text-slate-950">{percent}%</p>
            <p className="pb-1 text-base font-medium text-slate-600">
              {completedCount} / {totalCount} 个任务已完成
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold text-sky-800">{getStatusText(percent)}</p>
          {syncLabel ? <p className="mt-2 text-sm font-medium text-sky-700">{syncLabel}</p> : null}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          重置进度
        </button>
      </div>
      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-sky-700 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="整体学习进度"
        />
      </div>
    </section>
  );
}

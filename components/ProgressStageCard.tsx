import type { ProgressStage } from '@/lib/mockProgress';

type ProgressStageCardProps = {
  stage: ProgressStage;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
};

export function ProgressStageCard({ stage, completedTaskIds, onToggleTask }: ProgressStageCardProps) {
  const completedInStage = stage.tasks.filter((task) => completedTaskIds.includes(task.id)).length;

  return (
    <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-7">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{stage.title}</h2>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">
          {completedInStage} / {stage.tasks.length}
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {stage.tasks.map((task) => {
          const checked = completedTaskIds.includes(task.id);

          return (
            <li key={task.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50/70">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleTask(task.id)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-700 accent-sky-700 focus:ring-sky-200"
                />
                <span
                  className={`text-sm leading-6 transition sm:text-base ${
                    checked ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}
                >
                  {task.title}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

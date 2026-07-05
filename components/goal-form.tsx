'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { quickGoals } from '@/lib/examples';

export function GoalForm() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedGoal = goal.trim();
  const canSubmit = trimmedGoal.length > 0 && !isSubmitting;
  const hasError = touched && trimmedGoal.length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    if (!trimmedGoal) {
      return;
    }

    setIsSubmitting(true);
    router.push(`/plan?goal=${encodeURIComponent(trimmedGoal)}`);
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm shadow-sky-900/5 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="learning-goal" className="block text-sm font-medium text-slate-700">
          你的学习目标
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="learning-goal"
            value={goal}
            onBlur={() => setTouched(true)}
            onChange={(event) => {
              setGoal(event.target.value);
              setIsSubmitting(false);
            }}
            placeholder="我想学 Python 做数据分析"
            className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            aria-invalid={hasError}
            aria-describedby="goal-helper"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition focus:outline-none focus:ring-4 ${
              canSubmit
                ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/10 hover:bg-sky-800 focus:ring-sky-200'
                : 'cursor-not-allowed bg-slate-300 text-slate-500 focus:ring-slate-100'
            }`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            生成学习方案
          </button>
        </div>
        <p id="goal-helper" className={`text-sm ${hasError ? 'text-red-600' : 'text-slate-500'}`}>
          {hasError ? '请先输入一个学习目标。' : '支持回车提交，输入目标后会进入学习方案页。'}
        </p>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {quickGoals.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setGoal(example);
              setTouched(false);
              setIsSubmitting(false);
            }}
            className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

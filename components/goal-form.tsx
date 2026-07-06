'use client';

import { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { quickGoals } from '@/lib/examples';
import { detectUserIntent } from '@/lib/intent';

export function GoalForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const goal = String(formData.get('goal') || '').trim();
    const mode = formData.get('mode') === 'lite' ? 'lite' : 'deep';

    if (!goal) {
      return;
    }

    const intent = detectUserIntent(goal);
    event.preventDefault();

    if (intent.intent === 'ask') {
      window.location.href = `/ask?goal=${encodeURIComponent(intent.suggestedGoal)}&question=${encodeURIComponent(intent.suggestedQuestion)}`;
      return;
    }

    window.location.href = `/plan?goal=${encodeURIComponent(intent.suggestedGoal)}&mode=${mode}`;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm shadow-sky-900/5 sm:p-5">
      <form action="/plan" method="GET" className="space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="learning-goal" className="block text-sm font-medium text-slate-700">
          你的学习目标
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-800">生成模式</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="group relative cursor-pointer rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:bg-sky-50/60 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 has-[:checked]:ring-4 has-[:checked]:ring-sky-100">
              <input type="radio" name="mode" value="lite" className="sr-only" />
              <span className="flex items-start gap-3">
                <span className="mt-1 h-4 w-4 rounded-full border border-sky-200 bg-white ring-4 ring-white transition group-has-[:checked]:border-sky-700 group-has-[:checked]:bg-sky-700" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">快速规划</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">真实 AI 快速生成基础学习方案</span>
                </span>
              </span>
            </label>
            <label className="group relative cursor-pointer rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 transition hover:border-sky-200 hover:bg-sky-50/60 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 has-[:checked]:ring-4 has-[:checked]:ring-sky-100">
              <input type="radio" name="mode" value="deep" defaultChecked className="sr-only" />
              <span className="flex items-start gap-3">
                <span className="mt-1 h-4 w-4 rounded-full border border-sky-200 bg-white ring-4 ring-white transition group-has-[:checked]:border-sky-700 group-has-[:checked]:bg-sky-700" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">深度 AI 规划</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">真实 AI 深度生成完整学习路线</span>
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="learning-goal"
            name="goal"
            required
            placeholder="我想学 Python 做数据分析"
            className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            <ArrowRight className="h-4 w-4" />
            生成学习方案
          </button>
        </div>
        <p className="text-sm text-slate-500">支持回车提交；具体操作问题会自动进入 AI 问答。</p>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {quickGoals.map((example) => (
          <a
            key={example}
            href={`/plan?goal=${encodeURIComponent(example)}&mode=deep`}
            className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {example}
          </a>
        ))}
      </div>
    </div>
  );
}

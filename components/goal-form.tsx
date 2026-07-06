'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { detectUserIntent } from '@/lib/intent';

const homepageExamples = ['GPT 高效使用', 'Python 数据分析', 'React 前端开发', '三角函数'];
const planningModes = [
  {
    value: 'lite',
    title: '快速规划',
    description: '快速生成基础学习方案',
  },
  {
    value: 'deep',
    title: '深度 AILINES AI 规划',
    description: '完整生成路线、资料和实战路径',
  },
] as const;

type PlanningMode = (typeof planningModes)[number]['value'];

export function GoalForm() {
  const [goalValue, setGoalValue] = useState('');
  const [modeValue, setModeValue] = useState<PlanningMode>('deep');

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
    <div className="rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-2xl shadow-sky-950/20 backdrop-blur-md sm:p-5">
      <form action="/plan" method="GET" className="space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="learning-goal" className="sr-only">
          你的学习目标
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="learning-goal"
            name="goal"
            required
            value={goalValue}
            onChange={(event) => setGoalValue(event.target.value)}
            placeholder="在这里输入需求"
            className="min-h-14 flex-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-6 text-sm font-semibold text-white shadow-sm shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            生成学习路线
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <fieldset className="rounded-2xl border border-sky-100 bg-white/55 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">生成模式</legend>
          <input type="hidden" name="mode" value={modeValue} />
          <div className="grid gap-2 sm:grid-cols-2">
            {planningModes.map((mode) => {
              const selected = modeValue === mode.value;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setModeValue(mode.value)}
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-2xl border p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/80 focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                    selected ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-100' : 'border-slate-200 bg-white/75'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ring-4 ring-white ${selected ? 'border-sky-700 bg-sky-700' : 'border-sky-200 bg-white'}`}>
                      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">{mode.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{mode.description}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {homepageExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoalValue(example)}
            className="rounded-full border border-sky-100 bg-white/70 px-3 py-2 text-sm font-medium text-sky-900 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

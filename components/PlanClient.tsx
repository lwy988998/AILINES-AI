'use client';

import { useEffect, useMemo, useState } from 'react';
import { CourseStructureSection } from '@/components/CourseStructureSection';
import { PlanActions } from '@/components/PlanActions';
import { PlanHeader } from '@/components/PlanHeader';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ResourcesSection } from '@/components/ResourcesSection';
import { RoadmapSection } from '@/components/RoadmapSection';
import type { GeneratedPlan } from '@/lib/ai/types';
import type { MockPlan } from '@/lib/mockPlan';

type PlanClientProps = {
  goal: string;
  initialPlan: MockPlan;
};

type PlanStatus = 'loading' | 'ready' | 'error';

const REQUEST_TIMEOUT_MS = 45_000;
const generatedPlanCache = new Map<string, Promise<MockPlan>>();

function ensureArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function adaptGeneratedPlan(plan: GeneratedPlan): MockPlan {
  return {
    title: plan.title,
    duration: `${plan.durationWeeks} 周`,
    summary: plan.summary,
    roadmap: ensureArray(plan.phases).map((phase) => ({
      name: phase.name,
      duration: `${phase.durationWeeks} 周`,
      goal: phase.objective,
      description: phase.description,
    })),
    courseStructure: ensureArray(plan.phases).map((phase) => ({
      stage: phase.name,
      topics: ensureArray(phase.topics),
    })),
    resources: ensureArray(plan.resources).map((resource) => ({
      name: resource.name,
      type: resource.type as MockPlan['resources'][number]['type'],
      difficulty: resource.difficulty as MockPlan['resources'][number]['difficulty'],
      free: resource.free,
      description: resource.description,
      href: resource.url,
    })),
    projects: ensureArray(plan.projects).map((project) => ({
      name: project.name,
      difficulty: project.difficulty as MockPlan['projects'][number]['difficulty'],
      duration: `${project.estimatedHours} 小时`,
      output: project.output,
      acceptance: ensureArray(project.acceptanceCriteria).join('；'),
    })),
  };
}

function validatePlan(plan: MockPlan) {
  return Boolean(
    plan.title &&
      plan.summary &&
      plan.roadmap.length > 0 &&
      plan.courseStructure.length > 0 &&
      plan.resources.length > 0 &&
      plan.projects.length > 0,
  );
}

function requestGeneratedPlan(goal: string, forceRefresh = false) {
  if (forceRefresh) {
    generatedPlanCache.delete(goal);
  }

  const cachedRequest = generatedPlanCache.get(goal);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = new Promise<MockPlan>(async (resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'AI 学习方案生成失败，请稍后重试');
      }

      const adaptedPlan = adaptGeneratedPlan(data as GeneratedPlan);

      if (!validatePlan(adaptedPlan)) {
        throw new Error('AI 返回内容格式异常，请稍后重试');
      }

      resolve(adaptedPlan);
    } catch (error) {
      generatedPlanCache.delete(goal);
      if (error instanceof DOMException && error.name === 'AbortError') {
        reject(new Error('AI 生成超时，请稍后重试'));
      } else {
        reject(error);
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  });

  generatedPlanCache.set(goal, request);
  return request;
}

function LoadingPlan({ goal }: { goal: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-700" />
          AI 生成中
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          正在生成你的学习方案
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          AI 正在根据你的学习目标规划路线、课程、资源和项目实战路径。
        </p>
        <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-800">当前目标</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{goal}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">通常需要 10-30 秒，请稍候。</p>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function PlanClient({ goal, initialPlan }: PlanClientProps) {
  const [plan, setPlan] = useState<MockPlan>(initialPlan);
  const [status, setStatus] = useState<PlanStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadPlan() {
      setStatus('loading');
      setErrorMessage('');

      try {
        const generatedPlan = await requestGeneratedPlan(goal, retryCount > 0);

        if (!ignore) {
          setPlan(generatedPlan);
          setStatus('ready');
        }
      } catch (error) {
        if (!ignore) {
          setPlan(initialPlan);
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'AI 学习方案生成失败，请稍后重试');
        }
      }
    }

    loadPlan();

    return () => {
      ignore = true;
    };
  }, [goal, initialPlan, retryCount]);

  const statusText = useMemo(() => {
    if (status === 'error') return `AI 生成暂时失败，已为你展示基础学习方案。${errorMessage ? `原因：${errorMessage}` : ''}`;
    return '已生成真实 AI 学习方案';
  }, [errorMessage, status]);

  if (status === 'loading') {
    return <LoadingPlan goal={goal} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} />
      <section
        className={`flex flex-col gap-3 rounded-3xl border p-4 text-sm font-medium shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between ${
          status === 'error' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        <span>{statusText}</span>
        {status === 'error' ? (
          <button
            type="button"
            onClick={() => setRetryCount((currentCount) => currentCount + 1)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200"
          >
            重新生成
          </button>
        ) : null}
      </section>
      <RoadmapSection stages={plan.roadmap} />
      <CourseStructureSection stages={plan.courseStructure} />
      <ResourcesSection resources={plan.resources} />
      <ProjectsSection projects={plan.projects} />
      <PlanActions goal={goal} title={plan.title} />
    </div>
  );
}

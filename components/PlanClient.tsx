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

function adaptGeneratedPlan(plan: GeneratedPlan): MockPlan {
  return {
    title: plan.title,
    duration: `${plan.durationWeeks} 周`,
    summary: plan.summary,
    roadmap: plan.phases.map((phase) => ({
      name: phase.name,
      duration: `${phase.durationWeeks} 周`,
      goal: phase.objective,
      description: phase.description,
    })),
    courseStructure: plan.phases.map((phase) => ({
      stage: phase.name,
      topics: phase.topics,
    })),
    resources: plan.resources.map((resource) => ({
      name: resource.name,
      type: resource.type as MockPlan['resources'][number]['type'],
      difficulty: resource.difficulty as MockPlan['resources'][number]['difficulty'],
      free: resource.free,
      description: resource.description,
      href: resource.url,
    })),
    projects: plan.projects.map((project) => ({
      name: project.name,
      difficulty: project.difficulty as MockPlan['projects'][number]['difficulty'],
      duration: `${project.estimatedHours} 小时`,
      output: project.output,
      acceptance: project.acceptanceCriteria.join('；'),
    })),
  };
}

export function PlanClient({ goal, initialPlan }: PlanClientProps) {
  const [plan, setPlan] = useState<MockPlan>(initialPlan);
  const [status, setStatus] = useState<PlanStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadPlan() {
      setStatus('loading');
      setErrorMessage('');

      try {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goal }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'AI 学习方案生成失败，请稍后重试');
        }

        if (!ignore) {
          setPlan(adaptGeneratedPlan(data as GeneratedPlan));
          setStatus('ready');
        }
      } catch (error) {
        if (!ignore) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'AI 学习方案生成失败，请稍后重试');
        }
      }
    }

    loadPlan();

    return () => {
      ignore = true;
    };
  }, [goal]);

  const statusText = useMemo(() => {
    if (status === 'loading') return '正在生成真实 AI 学习方案，请稍等...';
    if (status === 'error') return `AI 方案暂时不可用：${errorMessage}。当前先展示备用静态方案。`;
    return '已生成真实 AI 学习方案';
  }, [errorMessage, status]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} />
      <section
        className={`rounded-3xl border p-4 text-sm font-medium shadow-sm shadow-sky-900/5 ${
          status === 'error'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : status === 'ready'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-sky-100 bg-white text-sky-800'
        }`}
      >
        {statusText}
      </section>
      <RoadmapSection stages={plan.roadmap} />
      <CourseStructureSection stages={plan.courseStructure} />
      <ResourcesSection resources={plan.resources} />
      <ProjectsSection projects={plan.projects} />
      <PlanActions goal={goal} />
    </div>
  );
}

import type { GeneratedPlan } from '@/lib/ai/types';
import type { MockPlan } from '@/lib/mockPlan';

function ensureArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function adaptGeneratedPlan(plan: GeneratedPlan): MockPlan {
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

export function isRenderablePlan(plan: MockPlan) {
  return Boolean(
    plan.title &&
      plan.summary &&
      plan.roadmap.length > 0 &&
      plan.courseStructure.length > 0 &&
      plan.resources.length > 0 &&
      plan.projects.length > 0,
  );
}

import type { GeneratedPlan, GeneratedPlanPhase, GeneratedPlanStep } from '@/lib/ai/types';
import type { CourseStep, MockPlan } from '@/lib/mockPlan';

function ensureArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function adaptStep(step: GeneratedPlanStep, index: number, phase: GeneratedPlanPhase): CourseStep {
  return {
    title: safeText(step.title, `第 ${index + 1} 步：${safeText(phase.name, '理解本阶段重点')}`),
    explanation: safeText(step.explanation, safeText(phase.description, '先理解本阶段核心概念，再通过练习把知识转成可执行能力。')),
    example: safeText(step.example, ''),
    action: safeText(step.action, '完成本步骤对应练习，并记录遇到的问题。'),
    check: safeText(step.check, '能用自己的话解释本步骤，并独立完成一个小练习。'),
  };
}

function phaseTasks(phase: GeneratedPlanPhase) {
  const tasks = ensureArray(phase.tasks).filter((task): task is string => typeof task === 'string' && task.trim().length > 0);
  if (tasks.length > 0) return tasks;
  return ensureArray(phase.topics).slice(0, 5);
}

export function adaptGeneratedPlan(plan: GeneratedPlan): MockPlan {
  const phases = ensureArray(plan.phases);

  return {
    title: safeText(plan.title, 'AILINES AI 学习方案'),
    duration: `${typeof plan.durationWeeks === 'number' ? plan.durationWeeks : phases.length * 2} 周`,
    summary: safeText(plan.summary, safeText(plan.overview, '围绕你的目标生成阶段化学习路线。')),
    overview: safeText(plan.overview, safeText(plan.summary, '从目标拆解、核心知识、练习任务到阶段产出，逐步推进学习。')),
    audience: safeText(plan.audience, '希望系统学习并通过练习获得实际产出的学习者。'),
    prerequisites: ensureArray(plan.prerequisites).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    outcome: safeText(plan.outcome, '完成后能够形成可展示的学习成果，并知道下一步如何继续提升。'),
    roadmap: phases.map((phase, index) => ({
      name: safeText(phase.name, `阶段${index + 1}`),
      duration: safeText(phase.duration, `${typeof phase.durationWeeks === 'number' ? phase.durationWeeks : 2} 周`),
      goal: safeText(phase.objective, '掌握本阶段核心能力'),
      description: safeText(phase.description || phase.overview, '完成关键知识学习、练习和阶段产出。'),
      why: safeText(phase.why, ''),
      output: safeText(phase.output, ''),
      practice: safeText(phase.practice, ''),
      checkpoint: safeText(phase.checkpoint, ''),
      commonMistakes: ensureArray(phase.commonMistakes).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
      steps: ensureArray(phase.steps).map((step, stepIndex) => adaptStep(step, stepIndex, phase)),
    })),
    courseStructure: phases.map((phase) => ({
      stage: safeText(phase.name, '学习阶段'),
      topics: ensureArray(phase.topics).length > 0 ? ensureArray(phase.topics) : phaseTasks(phase),
    })),
    resources: ensureArray(plan.resources).map((resource) => ({
      name: safeText(resource.name, '学习资源'),
      type: resource.type as MockPlan['resources'][number]['type'],
      difficulty: resource.difficulty as MockPlan['resources'][number]['difficulty'],
      free: Boolean(resource.free),
      description: safeText(resource.description, '适合作为当前目标的补充学习资料。'),
      href: safeText(resource.url, '#'),
    })),
    projects: ensureArray(plan.projects).map((project) => ({
      name: safeText(project.name, '阶段实践项目'),
      difficulty: project.difficulty as MockPlan['projects'][number]['difficulty'],
      duration: `${typeof project.estimatedHours === 'number' ? project.estimatedHours : 4} 小时`,
      output: safeText(project.output, '一个可检查的练习成果。'),
      acceptance: ensureArray(project.acceptanceCriteria).join('；') || '目标明确、过程可复盘、结果可展示。',
    })),
  };
}

export function isRenderablePlan(plan: MockPlan) {
  return Boolean(
    plan.title &&
      plan.summary &&
      Array.isArray(plan.roadmap) &&
      plan.roadmap.length > 0 &&
      Array.isArray(plan.courseStructure) &&
      plan.courseStructure.length > 0 &&
      Array.isArray(plan.resources) &&
      plan.resources.length > 0 &&
      Array.isArray(plan.projects) &&
      plan.projects.length > 0,
  );
}

import { isGenericCourseText } from '@/lib/courseDomainQuality';
import type { MockPlan } from '@/lib/mockPlan';

export type ProgressTask = {
  id: string;
  title: string;
};

export type ProgressStage = {
  id: string;
  title: string;
  tasks: ProgressTask[];
};

function slug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (ascii) return ascii.slice(0, 48);
  return fallback;
}

function stripStepPrefix(value: string) {
  return value.replace(/^第\s*\d+\s*步[:：]?\s*/, '').trim();
}

function uniqueSpecificTitles(items: string[]) {
  const seen = new Set<string>();
  return items
    .map((item) => item.trim())
    .filter((item) => item && !isGenericCourseText(item))
    .filter((item) => {
      const key = item.replace(/[\s，。；：、,.!?！？;:「」“”'"（）()【】\[\]-]/g, '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function progressStagesFromCoursePlan(plan: MockPlan, goal: string): ProgressStage[] {
  void goal;
  const roadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  const structure = Array.isArray(plan.courseStructure) ? plan.courseStructure : [];

  return roadmap.map((stage, index) => {
    const structureTopics = structure.find((item) => item.stage === stage.name)?.topics || [];
    const taskTitles = uniqueSpecificTitles([
      ...(Array.isArray(stage.tasks) ? stage.tasks : []),
      ...(Array.isArray(stage.steps) ? stage.steps.map((step) => stripStepPrefix(step.title)) : []),
      ...structureTopics,
    ]).slice(0, 8);
    const phaseId = slug(stage.name || '', `phase-${index + 1}`);

    return {
      id: phaseId,
      title: stage.name || `阶段 ${index + 1}`,
      tasks: taskTitles.map((title, taskIndex) => ({ id: `${phaseId}-${taskIndex + 1}`, title })),
    };
  }).filter((stage) => stage.tasks.length > 0);
}

export const progressStages: ProgressStage[] = [];

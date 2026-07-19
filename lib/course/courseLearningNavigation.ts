import type { PlanMode } from '@/lib/ai/types';
import type { CourseProgressSummary } from '@/lib/course/courseProgressRepository';
import type { LearningCardProgressItem, LearningCardStatus } from '@/lib/course/learningCardProgressRepository';
import type { CourseStage, MockPlan, RoadmapStage } from '@/lib/mockPlan';

export type LearningHrefInput = {
  goal: string;
  mode: PlanMode;
  courseId?: string;
  anonymousId?: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topic: string;
};

export function createLearnHref(input: LearningHrefInput) {
  const params = new URLSearchParams({
    goal: input.goal,
    mode: input.mode,
    phaseIndex: String(input.phaseIndex),
    phaseName: input.phaseName,
    topicIndex: String(input.topicIndex),
    topic: input.topic,
  });
  if (input.courseId) params.set('courseId', input.courseId);
  if (input.anonymousId) params.set('anonymousId', input.anonymousId);
  return `/learn?${params.toString()}`;
}

export function createPhaseHref(input: { goal: string; mode: PlanMode; courseId?: string; anonymousId?: string; phaseIndex: number; phaseName: string }) {
  const params = new URLSearchParams({ goal: input.goal, mode: input.mode, phaseIndex: String(input.phaseIndex), phaseName: input.phaseName });
  if (input.courseId) params.set('courseId', input.courseId);
  if (input.anonymousId) params.set('anonymousId', input.anonymousId);
  return `/phase?${params.toString()}`;
}

export function createPlanHref(input: { goal: string; mode: PlanMode; courseId?: string; anonymousId?: string }) {
  if (input.courseId) {
    const params = new URLSearchParams({ courseId: input.courseId });
    if (input.anonymousId) params.set('anonymousId', input.anonymousId);
    return `/plan?${params.toString()}`;
  }
  const params = new URLSearchParams({ goal: input.goal, mode: input.mode });
  if (input.anonymousId) params.set('anonymousId', input.anonymousId);
  return `/plan?${params.toString()}`;
}

function safeRelativeUrl(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function getFirstLearnHref(input: { plan: Pick<MockPlan, 'courseStructure'>; goal: string; mode: PlanMode; courseId?: string; anonymousId?: string }) {
  const firstPhase = input.plan.courseStructure?.[0];
  const firstTopic = firstPhase?.topics?.[0];
  if (!firstPhase || !firstTopic) return createPlanHref(input);
  return createLearnHref({ ...input, phaseIndex: 1, phaseName: firstPhase.stage, topicIndex: 1, topic: firstTopic });
}

export function getPlanPrimaryCta(input: { plan: Pick<MockPlan, 'courseStructure'>; goal: string; mode: PlanMode; courseId?: string; anonymousId?: string; courseProgress?: CourseProgressSummary | null }) {
  const restoredUrl = safeRelativeUrl(input.courseProgress?.lastVisitedUrl);
  const hasProgress = Boolean(input.courseProgress && (input.courseProgress.overallPercent > 0 || input.courseProgress.lastVisitedUrl || input.courseProgress.lastTopicTitle));
  return {
    href: restoredUrl || getFirstLearnHref(input),
    label: hasProgress ? '继续学习' : '开始学习',
    helper: hasProgress
      ? `上次学到：${input.courseProgress?.lastPhaseName || '课程大纲'}${input.courseProgress?.lastTopicTitle ? ` / ${input.courseProgress.lastTopicTitle}` : ''}`
      : '从第一个学习点开始，完成后会自动更新课程进度。',
  };
}

export function createProgressLookup(items?: LearningCardProgressItem[] | null) {
  const map = new Map<string, LearningCardStatus>();
  for (const item of items || []) {
    map.set(`${item.phaseIndex}:${item.topicIndex}`, item.status);
    if (item.topicIndex === 0) map.set(`${item.phaseIndex}:1`, item.status);
  }
  return (phaseIndex: number, topicIndex: number) => map.get(`${phaseIndex}:${topicIndex}`) || 'not_started';
}

export function getStageTopics(stage: RoadmapStage | undefined, courseStage: CourseStage | undefined) {
  const fromCourse = Array.isArray(courseStage?.topics) ? courseStage.topics.filter(Boolean) : [];
  if (fromCourse.length > 0) return fromCourse;
  const stageAny = stage as unknown as Record<string, unknown> | undefined;
  const candidates = [stageAny?.topics, stageAny?.learningCards, stageAny?.cards, stageAny?.tasks].find(Array.isArray) as unknown[] | undefined;
  return (candidates || [])
    .map((item) => (typeof item === 'string' ? item : String((item as Record<string, unknown>)?.title || (item as Record<string, unknown>)?.name || '')))
    .map((item) => item.trim())
    .filter(Boolean);
}

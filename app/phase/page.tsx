import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, ClipboardCheck, Clock3, ExternalLink, ListChecks, PlayCircle, Route, Trophy } from 'lucide-react';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { CourseMindMap } from '@/components/course/CourseMindMap';
import { CourseSlides } from '@/components/course/CourseSlides';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { SiteHeader } from '@/components/site-header';
import { InteractiveLearningSteps } from '@/components/phase/InteractiveLearningSteps';
import { InteractivePhaseTasks } from '@/components/phase/InteractivePhaseTasks';
import { type PhaseStep, type PhaseTask } from '@/lib/mockPhaseDetail';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { readCachedPlan } from '@/lib/ai/planCache';
import type { PlanMode } from '@/lib/ai/types';
import { type MockPlan, type RoadmapStage } from '@/lib/mockPlan';
import { searchResources } from '@/lib/search/searchResources';
import type { SearchResource } from '@/lib/search/resourceTypes';
import { buildUnavailableCourseContentNotice, normalizeCoursePlanContent, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { generatePhaseExpansion } from '@/lib/ai/generatePhaseExpansion';
import { markCourseContentSource, type CourseContentSource } from '@/lib/courseContentSource';
import { listLearningCardProgress } from '@/lib/course/learningCardProgressRepository';
import { createLearnHref } from '@/lib/course/courseLearningNavigation';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;

type PhasePageProps = {
  searchParams: Promise<{
    goal?: string;
    phaseIndex?: string;
    phaseName?: string;
    mode?: string;
    courseId?: string;
    anonymousId?: string;
    forcePhase?: string;
    retry?: string;
  }>;
};

function parsePhaseIndex(value?: string) {
  const parsed = Number.parseInt(value || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

type DisplayResource = {
  title: string;
  source: string;
  type: string;
  difficulty: string;
  language: string;
  free: boolean;
  description: string;
  reason: string;
  url: string;
  score: number;
};



function normalizeMode(value?: string): PlanMode {
  return value === 'lite' ? 'lite' : 'deep';
}

function sourceForStoredCourse(source?: string | null): CourseContentSource {
  if (source === 'fallback' || source === 'domain-fallback') return 'domain-fallback';
  if (source === 'template' || source === 'mock') return 'template';
  if (source === 'invalid') return 'invalid';
  return 'legacy-ai';
}

function normalizeStep(step: unknown, index: number, fallbackTitle: string): PhaseStep {
  const candidate = step && typeof step === 'object' ? (step as Partial<PhaseStep>) : {};
  return {
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : `第 ${index + 1} 步：${fallbackTitle}`,
    explanation:
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation
        : '',
    example: typeof candidate.example === 'string' ? candidate.example : '',
    action: typeof candidate.action === 'string' && candidate.action.trim() ? candidate.action : '',
    check: typeof candidate.check === 'string' && candidate.check.trim() ? candidate.check : '',
  };
}

function stepsFromStage(stage: RoadmapStage | undefined): PhaseStep[] {
  if (stage && Array.isArray(stage.steps) && stage.steps.length > 0) {
    return stage.steps.map((step, index) => normalizeStep(step, index, stage.name || '本阶段学习点')).filter((step) => step.title && step.explanation && step.action && step.check);
  }
  return [];
}


function tasksFromStage(stage: RoadmapStage | undefined, stageOutput: string): PhaseTask[] {
  if (!stage) return [];

  const stageTasks = Array.isArray(stage.tasks) ? stage.tasks : [];
  const titles = stageTasks
    .map((task) => (typeof task === 'string' ? task.trim() : ''))
    .filter(Boolean)
    .slice(0, 6);

  if (titles.length === 0) return [];

  const steps = Array.isArray(stage.steps) ? stage.steps : [];

  return titles.map((title, index) => {
    const relatedStep = steps[index] || steps.find((step) => {
      const stepTitle = typeof step.title === 'string' ? step.title : '';
      return stepTitle.includes(title) || title.includes(stepTitle.replace(/^第\s*\d+\s*步[:：]?\s*/, ''));
    });
    const description = relatedStep?.explanation || stage.description || stage.goal || '';
    const output = relatedStep?.check || (index === titles.length - 1 ? stageOutput : '') || stage.checkpoint || '';
    return {
      title,
      duration: stage.duration || '30-60 分钟',
      description,
      output,
    };
  }).filter((task) => task.title && task.description && task.output);
}

async function getPlanStage(input: { goal: string; mode: PlanMode; phaseIndex: number; phaseName: string; courseId?: string; anonymousId?: string }): Promise<{ stage?: RoadmapStage; plan?: MockPlan }> {
  const { goal, mode, phaseIndex, phaseName, courseId, anonymousId } = input;
  try {
    if (courseId) {
      const user = await getCurrentUser();
      const ownedCourse = await getCourseOwnedByRequester({ courseId, userId: user?.id, anonymousId });
      const snapshot = ownedCourse?.snapshots[0]?.payload as (MockPlan & { phases?: unknown[] }) | undefined;
      if (snapshot) {
        const storedSource = sourceForStoredCourse(ownedCourse?.source);
        const hasStoredPlanShape = Array.isArray(snapshot.courseStructure) && Array.isArray(snapshot.roadmap);
        const plan = hasStoredPlanShape
          ? normalizeCoursePlanContent(markCourseContentSource(snapshot, storedSource), ownedCourse?.goal || goal)
          : adaptGeneratedPlan(markCourseContentSource(snapshot as unknown as Parameters<typeof adaptGeneratedPlan>[0], storedSource), mode);
        const planValidation = validateUserVisibleCourseContent(plan, { goal: ownedCourse?.goal || goal, mode, courseTitle: plan.title });
        if (!planValidation.valid) return {};
        const stages = Array.isArray(plan.roadmap) ? plan.roadmap : [];
        const normalizedPhaseName = phaseName.trim();
        return { plan, stage: stages.find((stage) => stage.name === normalizedPhaseName) || stages[phaseIndex - 1] || stages[0] };
      }
      return {};
    }

    const cachedPlan = await readCachedPlan(goal, mode);
    if (!cachedPlan) return {};
    const plan = adaptGeneratedPlan(markCourseContentSource(cachedPlan, 'legacy-ai'), mode);
    const planValidation = validateUserVisibleCourseContent(plan, { goal, mode, courseTitle: plan.title });
    if (!planValidation.valid) return {};
    const stages = Array.isArray(plan.roadmap) ? plan.roadmap : [];
    const normalizedPhaseName = phaseName.trim();
    return { plan, stage: stages.find((stage) => stage.name === normalizedPhaseName) || stages[phaseIndex - 1] || stages[0] };
  } catch (error) {
    console.warn('Phase plan unavailable', error instanceof Error ? error.message : 'unknown error');
    return {};
  }
}

function adaptSearchResource(resource: SearchResource): DisplayResource {
  return {
    title: resource.title,
    source: resource.source,
    type: resource.type,
    difficulty: resource.difficulty,
    language: resource.language,
    free: resource.free,
    description: resource.description,
    reason: resource.reason,
    url: resource.url,
    score: resource.score,
  };
}


function PhaseGenerationPendingState({ goal, mode, planHref, phaseHref }: { goal: string; mode: PlanMode; planHref: string; phaseHref: string }) {
  const retryHref = phaseHref;
  return (
    <main className="learn-app-page min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12 md:px-6">
        <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">阶段内容暂未生成完成</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{buildUnavailableCourseContentNotice('这个阶段')}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">当前课程结构还不完整，暂时无法生成阶段讲解、任务、课件和知识结构。请回到课程页重新生成或刷新后重试。</p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row sm:justify-center">
            <Link href={retryHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">重新生成阶段</Link>
            <Link href={planHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 interactive-button transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">返回课程大纲</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function PhasePage({ searchParams }: PhasePageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '你的目标';
  const mode = normalizeMode(params.mode);
  const courseId = params.courseId?.trim() || '';
  const anonymousId = params.anonymousId?.trim() || undefined;
  const modeLabel = mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
  const modeDescription = mode === 'lite' ? '轻量学习课程：阶段内容更聚焦，保留关键讲解和练习。' : '系统学习课程：阶段讲解、任务、课件和资料更完整。';
  const phaseIndex = parsePhaseIndex(params.phaseIndex);
  const rawPhaseName = params.phaseName?.trim() || '';
  const phaseName = rawPhaseName || `阶段${phaseIndex}`;
  const encodedGoal = encodeURIComponent(goal);
  const encodedMode = encodeURIComponent(mode);
  const encodedCourseId = encodeURIComponent(courseId);
  const anonymousQuery = anonymousId ? `&anonymousId=${encodeURIComponent(anonymousId)}` : '';
  const planHref = courseId ? `/plan?courseId=${encodedCourseId}${anonymousQuery}` : `/plan?goal=${encodedGoal}&mode=${encodedMode}${anonymousQuery}`;
  const phaseRetryParams = new URLSearchParams({ goal, mode, phaseIndex: String(phaseIndex), phaseName, forcePhase: '1', retry: String(Date.now()) });
  if (courseId) phaseRetryParams.set('courseId', courseId);
  if (anonymousId) phaseRetryParams.set('anonymousId', anonymousId);
  const phaseRetryHref = `/phase?${phaseRetryParams.toString()}`;
  const { stage: planStage, plan } = await getPlanStage({ goal, mode, phaseIndex, phaseName, courseId, anonymousId });
  const stageTitle = planStage?.name || phaseName;
  const stageTopics = plan?.courseStructure?.[phaseIndex - 1]?.topics || planStage?.tasks || [];
  const stageOutput = planStage?.output || '';
  const cardProgressItems = courseId || anonymousId ? await listLearningCardProgress({ courseId: courseId || undefined, anonymousId, goal, mode, phaseIndex, phaseName: stageTitle }).catch(() => []) : [];
  const completedTopicCount = stageTopics.filter((_topic, index) => cardProgressItems.some((item) => item.phaseIndex === phaseIndex && item.topicIndex === index + 1 && item.status === 'completed')).length;
  const inProgressTopicCount = stageTopics.filter((_topic, index) => cardProgressItems.some((item) => item.phaseIndex === phaseIndex && item.topicIndex === index + 1 && item.status === 'in_progress')).length;
  const stageTopicTotal = stageTopics.length;
  const stagePercent = stageTopicTotal > 0 ? Math.max(0, Math.min(100, Math.round((completedTopicCount / stageTopicTotal) * 100))) : 0;
  const phaseCompleted = stageTopicTotal > 0 && completedTopicCount >= stageTopicTotal;
  const firstIncompleteTopicIndex = Math.max(0, stageTopics.findIndex((_topic, index) => !cardProgressItems.some((item) => item.phaseIndex === phaseIndex && item.topicIndex === index + 1 && item.status === 'completed')));
  const primaryTopicIndex = firstIncompleteTopicIndex >= 0 ? firstIncompleteTopicIndex + 1 : 1;
  const primaryTopic = stageTopics[primaryTopicIndex - 1] || stageTitle;
  const primaryLearnHref = createLearnHref({ goal, mode, courseId: courseId || undefined, anonymousId, phaseIndex, phaseName: stageTitle, topicIndex: primaryTopicIndex, topic: primaryTopic });
  let teachingSteps = stepsFromStage(planStage);
  let phaseTasks = tasksFromStage(planStage, stageOutput);
  let generatedExpansion = null as Awaited<ReturnType<typeof generatePhaseExpansion>>;

  if (planStage) {
    generatedExpansion = await generatePhaseExpansion({ goal, mode, phaseIndex, stage: planStage, topics: stageTopics, resources: [] });
    if (generatedExpansion) {
      teachingSteps = generatedExpansion.steps;
      phaseTasks = generatedExpansion.tasks;
    }
  }

  const phaseValidation = validateUserVisibleCourseContent({ teachingSteps, phaseTasks, stageOutput, objective: generatedExpansion?.objective || planStage?.goal, description: generatedExpansion?.overview || planStage?.description }, { goal, mode, phaseName: stageTitle, availableTopics: teachingSteps.map((step) => step.title), availableTasks: phaseTasks.map((task) => task.title) });
  if (!planStage || teachingSteps.length === 0 || !phaseValidation.valid) {
    console.warn('Phase generation quality rejected', { courseIdPresent: Boolean(courseId), phaseIndex, qualityValid: phaseValidation.valid, reasons: phaseValidation.reasons, fieldPaths: phaseValidation.fieldPaths, score: phaseValidation.score });
    return <PhaseGenerationPendingState goal={goal} mode={mode} planHref={planHref} phaseHref={phaseRetryHref} />;
  }
  const phaseSlides = (generatedExpansion?.slides?.length ? generatedExpansion.slides : teachingSteps.map((step, index) => ({
    title: step.title || `第 ${index + 1} 步`,
    subtitle: stageTitle,
    content: step.explanation,
    bullets: [step.example ? `例子：${step.example}` : '', `现在你要做：${step.action}`, `完成检查：${step.check}`].filter(Boolean),
    speakerNote: '先读懂讲解，再完成行动建议，最后用完成检查判断是否掌握。',
    relatedPhase: stageTitle,
  })));
  const phaseMindMap = {
    title: '当前阶段知识结构',
    nodes: [{
      id: 'root',
      label: stageTitle,
      children: (generatedExpansion?.knowledgeTopics?.length ? generatedExpansion.knowledgeTopics : teachingSteps.map((step) => step.title)).map((label, index) => ({ id: `step-${index + 1}`, label: (label || `第 ${index + 1} 步`).replace(/^第\s*\d+\s*步[:：]?\s*/, '') })),
    }],
  };
  const stageWhy = planStage?.why || '';
  const phaseContextSummary = [
    `阶段目标：${generatedExpansion?.objective || planStage?.goal || ''}`,
    `阶段导学：${generatedExpansion?.overview || stageWhy || ''}`,
    `阶段产出：${stageOutput || ''}`,
    ...teachingSteps.slice(0, 4).map((step, index) => `步骤 ${index + 1}：${step.title}。${step.explanation}`),
  ].filter(Boolean).join('\n').slice(0, 1000);
  const commonMistakes = Array.isArray(planStage?.commonMistakes) && planStage.commonMistakes.length > 0 ? planStage.commonMistakes : [];
  const progressHref = courseId ? `/progress?goal=${encodedGoal}&mode=${encodedMode}&courseId=${encodedCourseId}${anonymousQuery}` : `/progress?goal=${encodedGoal}&mode=${encodedMode}${anonymousQuery}`;
  const askHref = courseId ? `/ask?goal=${encodedGoal}&mode=${encodedMode}&courseId=${encodedCourseId}${anonymousQuery}` : `/ask?goal=${encodedGoal}&mode=${encodedMode}${anonymousQuery}`;
  const resourceSearchQuery = rawPhaseName ? `${goal} ${rawPhaseName} 学习资料 教程 课程 练习` : goal;
  let resources: DisplayResource[] = [];

  try {
    const resourceSearch = await Promise.race([
      searchResources(resourceSearchQuery),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('resource search timeout')), RESOURCE_SEARCH_TIMEOUT_MS);
      }),
    ]);

    if (resourceSearch.resources.length > 0) {
      resources = [...resourceSearch.resources]
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(adaptSearchResource);
    }
  } catch (error) {
    console.warn('Phase resource search fallback', error instanceof Error ? error.message : 'unknown error');
  }

  return (
    <main className="learn-app-page min-h-screen bg-[#f5f9ff]">
      {courseId ? <LastVisitedRecorder courseId={courseId} anonymousId={anonymousId} goal={goal} mode={mode} lastPageType="phase" lastPhaseIndex={phaseIndex} lastPhaseName={phaseName} /> : null}
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6 lg:px-8 lg:py-10 xl:max-w-7xl">
        <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 animate-slide-up sm:p-8">
          <Link
            href={planHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 interactive-button transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回学习方案
          </Link>
          <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
                <Route className="h-4 w-4" />
                第 {phaseIndex} 阶段详情
              </div>
              <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{stageTitle}</h1>
              <p className="mt-4 max-w-3xl break-words text-base leading-8 text-slate-600 sm:text-lg">针对「{goal}」的阶段学习计划</p>
              <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>{phaseCompleted ? '本阶段已完成' : inProgressTopicCount > 0 || completedTopicCount > 0 ? '当前阶段进度' : '本阶段未开始'}</span>
                  <span>{stagePercent}% · {completedTopicCount}/{stageTopicTotal || 0} 节</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-700 soft-progress-fill" style={{ width: `${stagePercent}%` }} />
                </div>
              </div>
              <div className="mt-5 max-w-full rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm shadow-sm sm:w-fit">
                <p className="font-semibold text-sky-800">当前模式：{modeLabel}</p>
                <p className="mt-1 leading-6 text-slate-600">{modeDescription}</p>
              </div>
            </div>
            <div className="mobile-button-stack grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-1">
              <Link
                href={primaryLearnHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                <PlayCircle className="h-4 w-4" />
                {phaseCompleted ? '复习本阶段' : completedTopicCount > 0 || inProgressTopicCount > 0 ? '继续本阶段' : '开始本阶段学习'}
              </Link>
              <Link
                href={askHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <Bot className="h-4 w-4" />
                问 AILINES AI
              </Link>
            </div>
          </div>
        </section>

        <section className="stagger-fade grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-5">
            <p className="text-sm font-semibold text-sky-700">阶段名称</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-950">{stageTitle}</p>
          </div>
          <div className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-5">
            <p className="text-sm font-semibold text-sky-700">当前学习目标</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-950">{planStage.goal}</p>
          </div>
          <div className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-5">
            <p className="text-sm font-semibold text-sky-700">推荐学习周期</p>
            <p className="mt-2 flex min-w-0 items-center gap-2 break-words text-lg font-semibold text-slate-950">
              <Clock3 className="h-4 w-4 text-sky-700" />
              {planStage.duration}
            </p>
          </div>
          <div className="interactive-card min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-5">
            <p className="text-sm font-semibold text-sky-700">适合人群</p>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">{`适合正在学习「${goal}」并准备完成「${stageTitle}」阶段任务的学习者。`}</p>
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段概览</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">阶段目标</h2>
            <p className="mt-3 break-words leading-7 text-slate-600">{planStage.goal || planStage.description}</p>
            <p className="mt-4 break-words rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">为什么先学：{stageWhy || planStage.description}</p>
            <p className="mt-3 break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">阶段产出：{stageOutput}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {stageTopics.map((topic, index) => {
              const topicNo = index + 1;
              const status = cardProgressItems.find((item) => item.phaseIndex === phaseIndex && item.topicIndex === topicNo)?.status || 'not_started';
              const href = createLearnHref({ goal, mode, courseId: courseId || undefined, anonymousId, phaseIndex, phaseName: stageTitle, topicIndex: topicNo, topic });
              return (
                <article key={`${topic}-${topicNo}`} className={`interactive-card rounded-2xl border p-4 ${status === 'completed' ? 'border-emerald-100 bg-emerald-50' : status === 'in_progress' ? 'border-sky-100 bg-sky-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-sky-700">第 {topicNo} 节</p>
                      <h3 className="mt-1 break-words font-semibold text-slate-950">{topic}</h3>
                      <p className="mt-2 text-sm text-slate-600">{status === 'completed' ? '已完成，可以复习巩固。' : status === 'in_progress' ? '当前学习中，继续完成本节。' : '还未开始，从这里进入微课程。'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'completed' ? 'bg-emerald-100 text-emerald-700' : status === 'in_progress' ? 'bg-sky-100 text-sky-800' : 'bg-white text-slate-600'}`}>{status === 'completed' ? '已完成' : status === 'in_progress' ? '学习中' : '未开始'}</span>
                  </div>
                  <Link href={href} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-sky-800 ring-1 ring-sky-100 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                    学习这一节<ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {phaseCompleted ? (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm shadow-sky-900/5 animate-soft-pop sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Trophy className="h-4 w-4" />本阶段已完成</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href={planHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">返回课程总览</Link>
              <Link href={primaryLearnHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">复习本阶段</Link>
            </div>
          </section>
        ) : null}

        <InteractiveLearningSteps steps={teachingSteps} goal={goal} mode={mode} courseId={courseId} phaseIndex={phaseIndex} phaseName={phaseName} commonMistakes={commonMistakes} />

        <InteractivePhaseTasks tasks={phaseTasks} goal={goal} mode={mode} courseId={courseId} phaseIndex={phaseIndex} phaseName={phaseName} />

        <CourseSlides slides={phaseSlides} phases={planStage ? [planStage] : []} title="当前阶段课件" description="把当前阶段拆成可翻页学习的课程卡片。" goal={goal} mode={mode} courseId={courseId} anonymousId={anonymousId} phaseIndex={phaseIndex} />

        <CourseMindMap mindMap={phaseMindMap} phases={planStage ? [planStage] : []} title="当前阶段知识结构" description="从步骤层级理解当前阶段的学习顺序。" goal={goal} mode={mode} />

        <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段相关资料</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">先整合，再作为参考资料使用</h2>
            <p className="mt-3 break-words text-sm leading-6 text-slate-600">这些资料只作为本阶段的补充入口。正文学习仍以阶段导学、分步讲解、任务练习和验收标准为主，避免把链接列表当课程内容。</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {resources.map((resource) => (
              <article key={resource.url} className="min-w-0 flex flex-col rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">{resource.type}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{resource.difficulty}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">{resource.language}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{resource.free ? '免费' : '付费'}</span>
                </div>
                <h3 className="mt-4 break-words text-lg font-semibold text-slate-950">{resource.title}</h3>
                <p className="mt-2 break-words text-sm font-medium text-slate-500">来源：{resource.source}</p>
                <p className="mt-2 flex-1 break-words text-sm leading-6 text-slate-600">{resource.description}</p>
                <p className="mt-3 break-words rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">推荐理由：{resource.reason}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  打开资源
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段验收 checklist</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">完成这些再进入下一阶段</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[planStage.checkpoint, stageOutput, ...phaseTasks.map((task) => task.output)].filter(Boolean).slice(0, 8).map((item) => (
              <div key={item} className="flex min-w-0 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 md:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-sky-700">
              <Trophy className="h-4 w-4" />
              阶段完成后
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">可以进入进度页勾选任务，或继续向 AILINES AI 追问本阶段卡点。</p>
          </div>
          <div className="mobile-button-stack flex flex-col gap-3 md:flex-row">
            <Link href={progressHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
              <ClipboardCheck className="h-4 w-4" />
              开始执行
            </Link>
            <Link href={askHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <Bot className="h-4 w-4" />
              问 AILINES AI
            </Link>
          </div>
        </section>
      </div>
      <FloatingAilinesChat
        pageType="phase"
        goal={goal}
        mode={mode}
        phaseName={stageTitle}
        contextTitle={stageTitle}
        contextSummary={phaseContextSummary}
      />
    </main>
  );
}

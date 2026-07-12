import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, ClipboardCheck, Clock3, ExternalLink, ListChecks, Route, Trophy } from 'lucide-react';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { CourseMindMap } from '@/components/course/CourseMindMap';
import { CourseSlides } from '@/components/course/CourseSlides';
import { SiteHeader } from '@/components/site-header';
import { InteractiveLearningSteps } from '@/components/phase/InteractiveLearningSteps';
import { InteractivePhaseTasks } from '@/components/phase/InteractivePhaseTasks';
import { getMockPhaseDetail, type PhaseResource, type PhaseStep } from '@/lib/mockPhaseDetail';
import { adaptGeneratedPlan } from '@/lib/ai/adaptGeneratedPlan';
import { readCachedPlan } from '@/lib/ai/planCache';
import type { PlanMode } from '@/lib/ai/types';
import { getMockPlanByGoal, type RoadmapStage } from '@/lib/mockPlan';
import { searchResources } from '@/lib/search/searchResources';
import type { SearchResource } from '@/lib/search/resourceTypes';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;

type PhasePageProps = {
  searchParams: Promise<{
    goal?: string;
    phaseIndex?: string;
    phaseName?: string;
    mode?: string;
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

function adaptMockResource(resource: PhaseResource): DisplayResource {
  return {
    title: resource.name,
    source: 'AILINES 推荐',
    type: resource.type,
    difficulty: resource.difficulty,
    language: '中文',
    free: resource.free,
    description: resource.description,
    reason: '当前阶段默认推荐资源，适合作为保底学习材料。',
    url: resource.href,
    score: 0,
  };
}


function normalizeMode(value?: string): PlanMode {
  return value === 'lite' ? 'lite' : 'deep';
}

function normalizeStep(step: unknown, index: number, fallbackTitle: string): PhaseStep {
  const candidate = step && typeof step === 'object' ? (step as Partial<PhaseStep>) : {};
  return {
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : `第 ${index + 1} 步：${fallbackTitle}`,
    explanation:
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation
        : '先理解本步骤的核心概念和使用场景，再通过一个小练习把它转化为可检查的能力。学习时要记录输入、过程、输出和卡点，避免只看摘要。',
    example: typeof candidate.example === 'string' ? candidate.example : '',
    action: typeof candidate.action === 'string' && candidate.action.trim() ? candidate.action : '完成一个小练习，并记录关键过程。',
    check: typeof candidate.check === 'string' && candidate.check.trim() ? candidate.check : '能用自己的话解释本步骤，并独立完成同类任务。',
  };
}

function stepsFromStage(stage: RoadmapStage | undefined, detailSteps: PhaseStep[]): PhaseStep[] {
  if (stage && Array.isArray(stage.steps) && stage.steps.length > 0) {
    return stage.steps.map((step, index) => normalizeStep(step, index, stage.name || '学习本阶段重点'));
  }

  if (Array.isArray(detailSteps) && detailSteps.length > 0) {
    return detailSteps.map((step, index) => normalizeStep(step, index, '学习本阶段重点'));
  }

  return [];
}

async function getPlanStage(goal: string, mode: PlanMode, phaseIndex: number, phaseName: string): Promise<RoadmapStage | undefined> {
  const fallbackPlan = getMockPlanByGoal(goal, mode);
  let plan = fallbackPlan;

  try {
    const cachedPlan = await readCachedPlan(goal, mode);
    if (cachedPlan) {
      plan = adaptGeneratedPlan(cachedPlan);
    }
  } catch (error) {
    console.warn('Phase cached plan fallback', error instanceof Error ? error.message : 'unknown error');
  }

  const stages = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  const normalizedPhaseName = phaseName.trim();
  return stages.find((stage) => stage.name === normalizedPhaseName) || stages[phaseIndex - 1] || stages[0];
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

export default async function PhasePage({ searchParams }: PhasePageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '你的目标';
  const mode = normalizeMode(params.mode);
  const modeLabel = mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
  const modeDescription = mode === 'lite' ? '轻量学习课程：阶段内容更聚焦，保留关键讲解和练习。' : '系统学习课程：阶段讲解、任务、课件和资料更完整。';
  const phaseIndex = parsePhaseIndex(params.phaseIndex);
  const rawPhaseName = params.phaseName?.trim() || '';
  const phaseName = rawPhaseName || `阶段${phaseIndex}`;
  const detail = getMockPhaseDetail(goal, phaseName, phaseIndex);
  const planStage = await getPlanStage(goal, mode, phaseIndex, phaseName);
  const teachingSteps = stepsFromStage(planStage, detail.steps);
  const stageOutput = planStage?.output || detail.output;
  const phaseSlides = teachingSteps.map((step, index) => ({
    title: step.title || `第 ${index + 1} 步`,
    subtitle: detail.phaseName,
    content: step.explanation,
    bullets: [step.example ? `例子：${step.example}` : '', `现在你要做：${step.action}`, `完成检查：${step.check}`].filter(Boolean),
    speakerNote: '先读懂讲解，再完成行动建议，最后用完成检查判断是否掌握。',
    relatedPhase: detail.phaseName,
  }));
  const phaseMindMap = {
    title: '当前阶段知识结构',
    nodes: [{
      id: 'root',
      label: detail.phaseName,
      children: teachingSteps.map((step, index) => ({ id: `step-${index + 1}`, label: (step.title || `第 ${index + 1} 步`).replace(/^第\s*\d+\s*步[:：]?\s*/, '') })),
    }],
  };
  const stageWhy = planStage?.why || detail.why;
  const phaseContextSummary = [
    `阶段目标：${detail.objective || planStage?.goal || ''}`,
    `为什么学：${stageWhy || ''}`,
    `阶段产出：${stageOutput || ''}`,
    ...teachingSteps.slice(0, 4).map((step, index) => `步骤 ${index + 1}：${step.title}。${step.explanation}`),
  ].filter(Boolean).join('\n').slice(0, 1000);
  const commonMistakes = Array.isArray(planStage?.commonMistakes) && planStage.commonMistakes.length > 0 ? planStage.commonMistakes : detail.commonMistakes;
  const encodedGoal = encodeURIComponent(goal);
  const encodedMode = encodeURIComponent(mode);
  const resourceSearchQuery = rawPhaseName ? `${goal} ${rawPhaseName} 学习资料 教程 课程 练习` : goal;
  let resources = detail.resources.map(adaptMockResource);

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
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <Link
            href={`/plan?goal=${encodedGoal}&mode=${encodedMode}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ArrowLeft className="h-4 w-4" />
            返回学习方案
          </Link>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
                <Route className="h-4 w-4" />
                第 {phaseIndex} 阶段详情
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{detail.phaseName}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">针对「{goal}」的阶段学习计划</p>
              <div className="mt-5 w-fit rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm shadow-sm">
                <p className="font-semibold text-sky-800">当前模式：{modeLabel}</p>
                <p className="mt-1 leading-6 text-slate-600">{modeDescription}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href={`/progress?goal=${encodedGoal}&mode=${encodedMode}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                <ListChecks className="h-4 w-4" />
                进入进度追踪
              </Link>
              <Link
                href={`/ask?goal=${encodedGoal}&mode=${encodedMode}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <Bot className="h-4 w-4" />
                问 AILINES AI
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <p className="text-sm font-semibold text-sky-700">阶段名称</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{detail.phaseName}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <p className="text-sm font-semibold text-sky-700">当前学习目标</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{detail.goal}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <p className="text-sm font-semibold text-sky-700">推荐学习周期</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <Clock3 className="h-4 w-4 text-sky-700" />
              {detail.duration}
            </p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <p className="text-sm font-semibold text-sky-700">适合人群</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail.audience}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段概览</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">阶段目标</h2>
            <p className="mt-3 leading-7 text-slate-600">{detail.objective || '暂无说明'}</p>
            <p className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">为什么先学：{stageWhy || '这个阶段用于建立后续学习所需的基础。'}</p>
            <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">阶段产出：{stageOutput || '一份可检查的阶段成果。'}</p>
          </div>
        </section>

        <InteractiveLearningSteps steps={teachingSteps} goal={goal} phaseIndex={phaseIndex} phaseName={phaseName} commonMistakes={commonMistakes} />

        <InteractivePhaseTasks tasks={detail.tasks} goal={goal} phaseIndex={phaseIndex} phaseName={phaseName} />

        <CourseSlides slides={phaseSlides} phases={planStage ? [planStage] : []} title="当前阶段课件" description="把当前阶段拆成可翻页学习的课程卡片。" />

        <CourseMindMap mindMap={phaseMindMap} phases={planStage ? [planStage] : []} title="当前阶段知识结构" description="从步骤层级理解当前阶段的学习顺序。" />

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段相关资料</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">优先使用稳定免费资源</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {resources.map((resource) => (
              <article key={resource.url} className="flex flex-col rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">{resource.type}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{resource.difficulty}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">{resource.language}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{resource.free ? '免费' : '付费'}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{resource.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">来源：{resource.source}</p>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{resource.description}</p>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">推荐理由：{resource.reason}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  打开资源
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">实战练习</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">用练习验证阶段能力</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {detail.practices.map((practice) => (
              <article key={practice.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white px-3 py-1 text-sky-800">{practice.difficulty}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">{practice.duration}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-950">{practice.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">练习目标：{practice.goal}</p>
                <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium leading-6 text-slate-700">验收标准：{practice.acceptance}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-sky-700">阶段验收 checklist</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">完成这些再进入下一阶段</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {detail.checklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-sky-700">
              <Trophy className="h-4 w-4" />
              阶段完成后
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">可以进入进度页勾选任务，或继续向 AILINES AI 追问本阶段卡点。</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/progress?goal=${encodedGoal}&mode=${encodedMode}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
              <ClipboardCheck className="h-4 w-4" />
              开始执行
            </Link>
            <Link href={`/ask?goal=${encodedGoal}&mode=${encodedMode}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
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
        phaseName={phaseName}
        contextTitle={detail.phaseName}
        contextSummary={phaseContextSummary}
      />
    </main>
  );
}

import Link from 'next/link';
import { CourseStructureSection } from '@/components/CourseStructureSection';
import { PlanActions } from '@/components/PlanActions';
import { PlanHeader } from '@/components/PlanHeader';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ResourcesSection } from '@/components/ResourcesSection';
import { RoadmapSection } from '@/components/RoadmapSection';
import { SiteHeader } from '@/components/site-header';
import { adaptGeneratedPlan, isRenderablePlan } from '@/lib/ai/adaptGeneratedPlan';
import { generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { detectUserIntent } from '@/lib/intent';
import { getMockPlanByGoal, type MockPlan } from '@/lib/mockPlan';
import { searchResources } from '@/lib/search/searchResources';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    forcePlan?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const rawGoal = params.goal?.trim() || '';
  const mode: PlanMode = params.mode === 'lite' ? 'lite' : 'deep';
  const forcePlan = params.forcePlan === '1';
  const goal = rawGoal || '你的目标';
  const intent = detectUserIntent(rawGoal);
  const askHref = `/ask?goal=${encodeURIComponent(goal)}&question=${encodeURIComponent(goal)}`;
  const forcePlanHref = `/plan?goal=${encodeURIComponent(goal)}&mode=deep&forcePlan=1`;

  if (rawGoal && intent.intent === 'ask' && !forcePlan) {
    return (
      <main className="min-h-screen bg-[#f5f9ff]">
        <SiteHeader />
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <p className="text-sm font-semibold text-sky-700">输入识别：具体问答</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              这更像一个具体问题
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              你输入的内容更适合通过轻量问答获得步骤化解答，而不是生成长期学习路线。
            </p>
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              当前输入：{goal}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={askHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                去问 AI
              </Link>
              <Link
                href={forcePlanHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                仍然生成学习路线
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const fallbackPlan = getMockPlanByGoal(goal);
  let plan = fallbackPlan;
  let isAIPlan = false;
  let errorMessage = '';
  let resourceSourceMessage = '以下为 AI 推荐资源';
  const deepModeHref = `/plan?goal=${encodeURIComponent(goal)}&mode=deep${forcePlan ? '&forcePlan=1' : ''}`;
  const retryHref = `/plan?goal=${encodeURIComponent(goal)}&mode=${mode}&forcePlan=${forcePlan ? '1' : '0'}&retry=${Date.now()}`;

  if (rawGoal) {
    try {
      const generatedPlan = await generatePlanWithAI(rawGoal, mode);
      const adaptedPlan = adaptGeneratedPlan(generatedPlan);

      if (!isRenderablePlan(adaptedPlan)) {
        throw new Error('AI 返回内容格式异常，请稍后重试');
      }

      plan = adaptedPlan;
      isAIPlan = true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'AI 生成暂时失败';
    }

    try {
      const resourceSearch = await Promise.race([
        searchResources(rawGoal),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('resource search timeout')), RESOURCE_SEARCH_TIMEOUT_MS);
        }),
      ]);

      if (resourceSearch.resources.length > 0) {
        const searchedResources: MockPlan['resources'] = resourceSearch.resources.slice(0, 8).map((resource) => ({
          name: resource.title,
          type: resource.type,
          difficulty: resource.difficulty,
          free: resource.free,
          description: resource.description || resource.reason,
          href: resource.url,
        }));

        plan = {
          ...plan,
          resources: searchedResources,
        };
        resourceSourceMessage = '已为你补充全网真实学习资源';
      }
    } catch (error) {
      console.warn('Resource search fallback', error instanceof Error ? error.message : 'unknown error');
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} />
        {rawGoal ? (
          <section
            className={`flex flex-col gap-3 rounded-3xl border p-4 text-sm font-medium shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between ${
              isAIPlan ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <span>
              {isAIPlan
                ? mode === 'lite'
                  ? '已生成快速 AI 学习方案'
                  : '已生成深度 AI 学习方案'
                : `AI 生成暂时失败，已为你展示基础学习方案。${errorMessage ? `原因：${errorMessage}` : ''}`}
            </span>
            {mode === 'lite' ? (
              <Link
                href={deepModeHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                切换为深度 AI 规划
              </Link>
            ) : null}
            {!isAIPlan ? (
              <Link
                href={retryHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                重新生成
              </Link>
            ) : null}
          </section>
        ) : null}
        <RoadmapSection goal={goal} stages={plan.roadmap} />
        <CourseStructureSection stages={plan.courseStructure} />
        <section className="rounded-3xl border border-sky-100 bg-white px-5 py-4 text-sm font-medium text-sky-800 shadow-sm shadow-sky-900/5 sm:px-6">
          {resourceSourceMessage}
        </section>
        <ResourcesSection resources={plan.resources} />
        <ProjectsSection projects={plan.projects} />
        <PlanActions goal={goal} title={plan.title} />
      </div>
    </main>
  );
}

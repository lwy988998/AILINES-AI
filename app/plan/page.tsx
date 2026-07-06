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
import { getMockPlanByGoal } from '@/lib/mockPlan';

export const dynamic = 'force-dynamic';

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const rawGoal = params.goal?.trim() || '';
  const mode = params.mode === 'lite' ? 'lite' : 'deep';
  const goal = rawGoal || '你的目标';
  const fallbackPlan = getMockPlanByGoal(goal);
  let plan = fallbackPlan;
  let isAIPlan = false;
  let errorMessage = '';
  const deepModeHref = `/plan?goal=${encodeURIComponent(goal)}&mode=deep`;
  const retryHref = `${deepModeHref}&retry=${Date.now()}`;

  if (rawGoal && mode === 'deep') {
    try {
      const generatedPlan = await generatePlanWithAI(rawGoal);
      const adaptedPlan = adaptGeneratedPlan(generatedPlan);

      if (!isRenderablePlan(adaptedPlan)) {
        throw new Error('AI 返回内容格式异常，请稍后重试');
      }

      plan = adaptedPlan;
      isAIPlan = true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'AI 生成暂时失败';
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
              isAIPlan || mode === 'lite' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <span>
              {mode === 'lite'
                ? '当前为快速规划模式，已为你生成基础学习方案。'
                : isAIPlan
                  ? '已生成深度 AI 学习方案'
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
            {mode === 'deep' && !isAIPlan ? (
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
        <ResourcesSection resources={plan.resources} />
        <ProjectsSection projects={plan.projects} />
        <PlanActions goal={goal} title={plan.title} />
      </div>
    </main>
  );
}

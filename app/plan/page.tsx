import Link from 'next/link';
import { CourseHistoryRecorder } from '@/components/course/CourseHistoryRecorder';
import { CoursePlanView } from '@/components/course/CoursePlanView';
import { StoredCoursePlan } from '@/components/course/StoredCoursePlan';
import { SiteHeader } from '@/components/site-header';
import { adaptGeneratedPlan, isRenderablePlan } from '@/lib/ai/adaptGeneratedPlan';
import { generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getMockPlanByGoal, type MockPlan } from '@/lib/mockPlan';
import { searchResources } from '@/lib/search/searchResources';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    forcePlan?: string;
    courseId?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const courseId = params.courseId?.trim() || '';

  if (courseId) {
    return (
      <main className="min-h-screen bg-[#f5f9ff]">
        <SiteHeader />
        <StoredCoursePlan courseId={courseId} />
      </main>
    );
  }

  const rawGoal = params.goal?.trim() || '';
  const mode: PlanMode = params.mode === 'lite' || params.mode === 'deep' ? params.mode : 'deep';
  const forcePlan = params.forcePlan === '1';
  const goal = rawGoal || '你的目标';
  const modeLabel = mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
  const modeDescription = mode === 'lite' ? '轻量学习课程：保留讲解与练习，但阶段和资源更精简。' : '系统学习课程：更完整的阶段、分步讲解、课件、知识结构和练习。';

  const fallbackPlan = getMockPlanByGoal(goal, mode);
  let plan = fallbackPlan;
  let isAIPlan = false;
  let fallbackNotice = false;
  let resourceSourceMessage = '以下为 AILINES AI 推荐资源';
  const retryHref = `/plan?goal=${encodeURIComponent(goal)}&mode=${mode}&forcePlan=${forcePlan ? '1' : '0'}&retry=${Date.now()}`;

  if (rawGoal) {
    try {
      const generatedPlan = await generatePlanWithAI(rawGoal, mode);
      const adaptedPlan = adaptGeneratedPlan(generatedPlan);

      if (!isRenderablePlan(adaptedPlan)) {
        throw new Error('AILINES AI 返回内容格式异常，请稍后重试');
      }

      plan = adaptedPlan;
      isAIPlan = true;
    } catch {
      fallbackNotice = true;
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

  const notice = rawGoal ? (
    <section
      className={`flex flex-col gap-3 rounded-3xl border p-4 text-sm shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between ${
        isAIPlan ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-100 bg-white text-slate-700'
      }`}
    >
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">
          {isAIPlan ? (mode === 'lite' ? '已生成快速 AILINES AI 学习方案' : '已生成深度 AILINES AI 学习方案') : '已为你生成基础课程版本'}
        </p>
        {fallbackNotice ? <p className="font-medium text-slate-600">当前深度生成暂时未完成，AILINES AI 已先展示可学习的基础课程。你可以稍后点击“重新生成”获取更完整版本。</p> : null}
      </div>
      {!isAIPlan ? (
        <Link
          href={retryHref}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          重新生成
        </Link>
      ) : null}
    </section>
  ) : null;

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      {rawGoal ? <CourseHistoryRecorder goal={rawGoal} mode={mode} title={plan.title || rawGoal} plan={plan} /> : null}
      <SiteHeader />
      <CoursePlanView
        goal={goal}
        mode={mode}
        plan={plan}
        modeLabel={modeLabel}
        modeDescription={modeDescription}
        resourceSourceMessage={resourceSourceMessage}
        notice={notice}
      />
    </main>
  );
}

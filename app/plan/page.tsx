import Link from 'next/link';
import { Suspense } from 'react';
import { CourseHistoryRecorder } from '@/components/course/CourseHistoryRecorder';
import { CoursePlanView } from '@/components/course/CoursePlanView';
import { LitePlanView } from '@/components/course/LitePlanView';
import { StoredCoursePlan } from '@/components/course/StoredCoursePlan';
import { SiteHeader } from '@/components/site-header';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';
import { adaptGeneratedPlan, isRenderablePlan } from '@/lib/ai/adaptGeneratedPlan';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { generatePlanWithAI } from '@/lib/ai/generatePlan';
import type { PlanMode } from '@/lib/ai/types';
import { getMockPlanByGoal, type MockPlan } from '@/lib/mockPlan';
import { searchResources } from '@/lib/search/searchResources';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';
import { canUseFeature } from '@/lib/membership/permissions';
import { UpgradeRequiredCard } from '@/components/membership/UpgradeRequiredCard';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    forcePlan?: string;
    courseId?: string;
    anonymousId?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const courseId = params.courseId?.trim() || '';
  const rawGoal = params.goal?.trim() || '';
  const mode: PlanMode = params.mode === 'lite' || params.mode === 'deep' ? params.mode : 'deep';

  if (courseId) {
    return (
      <main className="min-h-screen bg-[#f5f9ff]">
        <SiteHeader />
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              <AilinesGeneratingState type="restore" estimatedSeconds={6} />
            </div>
          }
        >
          <StoredCoursePlan courseId={courseId} />
        </Suspense>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <AilinesGeneratingState type={mode === 'lite' ? 'lite-plan' : rawGoal ? 'plan' : 'generic'} estimatedSeconds={mode === 'lite' ? 10 : 24} />
          </div>
        }
      >
        <GeneratedPlanContent params={{ ...params, goal: rawGoal, mode }} />
      </Suspense>
    </main>
  );
}

async function GeneratedPlanContent({ params }: { params: Awaited<PlanPageProps['searchParams']> & { goal: string; mode: PlanMode } }) {
  const rawGoal = params.goal;
  const mode = params.mode;
  const forcePlan = params.forcePlan === '1';
  const anonymousId = params.anonymousId?.trim() || undefined;
  const goal = rawGoal || '你的目标';
  const modeLabel = mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
  const modeDescription = mode === 'lite' ? '轻量学习课程：保留讲解与练习，但阶段和资源更精简。' : '系统学习课程：更完整的阶段、分步讲解、课件、知识结构和练习。';

  const fallbackPlan = getMockPlanByGoal(goal, mode);
  let plan = fallbackPlan;
  let isAIPlan = false;
  let fallbackNotice = false;
  let resourceSourceMessage = '以下为 AILINES AI 推荐资源';
  let quotaNotice = '';
  const retryHref = `/plan?goal=${encodeURIComponent(goal)}&mode=${mode}&forcePlan=${forcePlan ? '1' : '0'}&retry=${Date.now()}`;

  const user = await getCurrentUser();
  const deepAccess = mode === 'deep' ? canUseFeature(user?.membershipTier, 'deep_plan') : { allowed: true };

  if (rawGoal && !deepAccess.allowed) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <UpgradeRequiredCard
          feature="deep_plan"
          title="需要升级会员"
          description={deepAccess.reason || '深度 AILINES AI 规划是 Pro 功能。你可以升级会员，或先使用快速规划。'}
          requiredTier={deepAccess.requiredTier || 'pro'}
          goal={goal}
          showLiteLink
        />
      </div>
    );
  }

  if (rawGoal) {
    const usage = await checkUsageLimit({ userId: user?.id, anonymousId, tier: user?.membershipTier, type: 'course_generate' });

    if (!usage.allowed) {
      fallbackNotice = true;
      quotaNotice = '今日课程生成次数已用完，升级会员可获得更多额度。已先展示基础课程版本。';
    } else {
      try {
        const generatedPlan = await generatePlanWithAI(rawGoal, mode);
        const adaptedPlan = adaptGeneratedPlan(generatedPlan, mode);

        if (!isRenderablePlan(adaptedPlan)) {
          throw new Error('AILINES AI 返回内容格式异常，请稍后重试');
        }

        plan = adaptedPlan;
        isAIPlan = true;
        await incrementUsage('course_generate', usage.scope);
      } catch {
        fallbackNotice = true;
        await incrementUsage('course_generate', usage.scope);
      }
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
        {fallbackNotice ? <p className="font-medium text-slate-600">{quotaNotice || (mode === 'lite' ? '当前快速生成暂时未完成，AILINES AI 已先展示贴合目标的基础步骤。你可以稍后点击“重新生成”获取更新版本。' : '当前深度生成暂时未完成，AILINES AI 已先展示可学习的基础课程。你可以稍后点击“重新生成”获取更完整版本。')}</p> : null}
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
    <>
      {rawGoal ? <CourseHistoryRecorder goal={rawGoal} mode={mode} title={plan.title || rawGoal} summary={plan.summary} source={isAIPlan ? 'ai' : 'fallback'} plan={plan} /> : null}
      {mode === 'lite' ? (
        <LitePlanView goal={goal} mode={mode} plan={plan} resourceSourceMessage={resourceSourceMessage} notice={notice} />
      ) : (
        <CoursePlanView
          goal={goal}
          mode={mode}
          plan={plan}
          modeLabel={modeLabel}
          modeDescription={modeDescription}
          resourceSourceMessage={resourceSourceMessage}
          notice={notice}
          membershipTier={user?.membershipTier || 'free'}
        />
      )}
    </>
  );
}

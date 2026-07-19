import Link from 'next/link';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { CourseStructureSection } from '@/components/CourseStructureSection';
import { CourseMindMap } from '@/components/course/CourseMindMap';
import { CourseProgressBanner } from '@/components/course/CourseProgressBanner';
import { CourseSlides } from '@/components/course/CourseSlides';
import { LockedFeatureCard } from '@/components/membership/UpgradeRequiredCard';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { PlanActions } from '@/components/PlanActions';
import { PlanHeader } from '@/components/PlanHeader';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ResourcesSection } from '@/components/ResourcesSection';
import { RoadmapSection } from '@/components/RoadmapSection';
import type { PlanMode } from '@/lib/ai/types';
import { canUseFeature } from '@/lib/membership/permissions';
import type { CourseProgressSummary } from '@/lib/course/courseProgressRepository';
import type { LearningCardProgressItem } from '@/lib/course/learningCardProgressRepository';
import { getPlanPrimaryCta } from '@/lib/course/courseLearningNavigation';
import type { MockPlan } from '@/lib/mockPlan';

type CoursePlanViewProps = {
  goal: string;
  mode: PlanMode;
  plan: MockPlan;
  modeLabel: string;
  modeDescription: string;
  resourceSourceMessage: string;
  notice?: React.ReactNode;
  courseId?: string;
  anonymousId?: string;
  courseProgress?: CourseProgressSummary | null;
  cardProgressItems?: LearningCardProgressItem[];
  membershipTier?: string | null;
};

export function CoursePlanView({ goal, mode, plan, modeLabel, modeDescription, resourceSourceMessage, notice, courseId, anonymousId, courseProgress, cardProgressItems = [], membershipTier }: CoursePlanViewProps) {
  const slidesAccess = canUseFeature(membershipTier, 'course_slides');
  const mindMapAccess = canUseFeature(membershipTier, 'mind_map');
  const primaryCta = getPlanPrimaryCta({ plan, goal, mode, courseId, anonymousId, courseProgress });

  return (
    <>
      {courseId ? <LastVisitedRecorder courseId={courseId} anonymousId={anonymousId} goal={goal} mode={mode} lastPageType="plan" /> : null}
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6 lg:px-8 lg:py-10 xl:max-w-7xl">
        <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} modeLabel={modeLabel} modeDescription={modeDescription} />
        <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-700 to-emerald-600 p-5 text-white shadow-sm shadow-sky-900/10 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100">下一步</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">从这里进入学习</h2>
              <p className="mt-2 text-sm leading-6 text-sky-50">{primaryCta.helper}</p>
            </div>
            <Link href={primaryCta.href} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-white/40">
              {primaryCta.label}
            </Link>
          </div>
        </section>
        {courseProgress ? <CourseProgressBanner progress={courseProgress} /> : null}
        {notice}
        {slidesAccess.allowed ? <CourseSlides slides={plan.slides} phases={plan.roadmap} goal={goal} mode={mode} courseId={courseId} anonymousId={anonymousId} /> : <LockedFeatureCard feature="course_slides" title="课程课件是 Pro 功能" requiredTier={slidesAccess.requiredTier || 'pro'} />}
        {mindMapAccess.allowed ? <CourseMindMap mindMap={plan.mindMap} phases={plan.roadmap} goal={goal} mode={mode} /> : <LockedFeatureCard feature="mind_map" title="思维导图是 Pro 功能" requiredTier={mindMapAccess.requiredTier || 'pro'} />}
        <RoadmapSection goal={goal} stages={plan.roadmap} courseStructure={plan.courseStructure} mode={mode} courseId={courseId} anonymousId={anonymousId} />
        <CourseStructureSection stages={plan.courseStructure} goal={goal} mode={mode} courseId={courseId} anonymousId={anonymousId} cardProgressItems={cardProgressItems} />
        <section className="rounded-3xl border border-sky-100 bg-white px-5 py-4 text-sm font-medium text-sky-800 shadow-sm shadow-sky-900/5 sm:px-6">
          {resourceSourceMessage}
        </section>
        <ResourcesSection resources={plan.resources} />
        <ProjectsSection projects={plan.projects} />
        <PlanActions goal={goal} title={plan.title} mode={mode} courseId={courseId} anonymousId={anonymousId} />
      </div>
      <FloatingAilinesChat
        pageType="plan"
        goal={goal}
        mode={mode}
        contextTitle={plan.title}
        contextSummary={[plan.summary, ...plan.roadmap.slice(0, 4).map((stage) => `${stage.name}：${stage.goal || stage.description || ''}`)].filter(Boolean).join('\n').slice(0, 1000)}
      />
    </>
  );
}

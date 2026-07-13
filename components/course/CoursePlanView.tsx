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
  courseProgress?: CourseProgressSummary | null;
  membershipTier?: string | null;
};

export function CoursePlanView({ goal, mode, plan, modeLabel, modeDescription, resourceSourceMessage, notice, courseId, courseProgress, membershipTier }: CoursePlanViewProps) {
  const slidesAccess = canUseFeature(membershipTier, 'course_slides');
  const mindMapAccess = canUseFeature(membershipTier, 'mind_map');

  return (
    <>
      {courseId ? <LastVisitedRecorder courseId={courseId} goal={goal} mode={mode} lastPageType="plan" /> : null}
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} modeLabel={modeLabel} modeDescription={modeDescription} />
        {courseProgress ? <CourseProgressBanner progress={courseProgress} /> : null}
        {notice}
        {slidesAccess.allowed ? <CourseSlides slides={plan.slides} phases={plan.roadmap} /> : <LockedFeatureCard feature="course_slides" title="课程课件是 Pro 功能" requiredTier={slidesAccess.requiredTier || 'pro'} />}
        {mindMapAccess.allowed ? <CourseMindMap mindMap={plan.mindMap} phases={plan.roadmap} /> : <LockedFeatureCard feature="mind_map" title="思维导图是 Pro 功能" requiredTier={mindMapAccess.requiredTier || 'pro'} />}
        <RoadmapSection goal={goal} stages={plan.roadmap} mode={mode} courseId={courseId} />
        <CourseStructureSection stages={plan.courseStructure} />
        <section className="rounded-3xl border border-sky-100 bg-white px-5 py-4 text-sm font-medium text-sky-800 shadow-sm shadow-sky-900/5 sm:px-6">
          {resourceSourceMessage}
        </section>
        <ResourcesSection resources={plan.resources} />
        <ProjectsSection projects={plan.projects} />
        <PlanActions goal={goal} title={plan.title} mode={mode} courseId={courseId} />
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

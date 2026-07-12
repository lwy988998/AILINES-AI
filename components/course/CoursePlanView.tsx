import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { CourseStructureSection } from '@/components/CourseStructureSection';
import { CourseMindMap } from '@/components/course/CourseMindMap';
import { CourseSlides } from '@/components/course/CourseSlides';
import { PlanActions } from '@/components/PlanActions';
import { PlanHeader } from '@/components/PlanHeader';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ResourcesSection } from '@/components/ResourcesSection';
import { RoadmapSection } from '@/components/RoadmapSection';
import type { PlanMode } from '@/lib/ai/types';
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
};

export function CoursePlanView({ goal, mode, plan, modeLabel, modeDescription, resourceSourceMessage, notice, courseId }: CoursePlanViewProps) {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} modeLabel={modeLabel} modeDescription={modeDescription} />
        {notice}
        <CourseSlides slides={plan.slides} phases={plan.roadmap} />
        <CourseMindMap mindMap={plan.mindMap} phases={plan.roadmap} />
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

import { CourseStructureSection } from '@/components/CourseStructureSection';
import { PlanActions } from '@/components/PlanActions';
import { PlanHeader } from '@/components/PlanHeader';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ResourcesSection } from '@/components/ResourcesSection';
import { RoadmapSection } from '@/components/RoadmapSection';
import { SiteHeader } from '@/components/site-header';
import { getMockPlanByGoal } from '@/lib/mockPlan';

type PlanPageProps = {
  searchParams: Promise<{
    goal?: string;
  }>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '你的目标';
  const plan = getMockPlanByGoal(goal);

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PlanHeader goal={goal} title={plan.title} duration={plan.duration} summary={plan.summary} />
        <RoadmapSection stages={plan.roadmap} />
        <CourseStructureSection stages={plan.courseStructure} />
        <ResourcesSection resources={plan.resources} />
        <ProjectsSection projects={plan.projects} />
        <PlanActions goal={goal} />
      </div>
    </main>
  );
}

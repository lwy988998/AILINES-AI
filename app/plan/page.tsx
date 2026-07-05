import { PlanClient } from '@/components/PlanClient';
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
      <PlanClient goal={goal} initialPlan={plan} />
    </main>
  );
}

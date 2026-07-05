import { ProgressTracker } from '@/components/ProgressTracker';
import { SiteHeader } from '@/components/site-header';

type ProgressPageProps = {
  searchParams: Promise<{
    goal?: string;
  }>;
};

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '我的';
  const title = params.goal?.trim() ? `${goal} 学习进度` : '我的学习进度';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <ProgressTracker goal={goal} title={title} />
    </main>
  );
}

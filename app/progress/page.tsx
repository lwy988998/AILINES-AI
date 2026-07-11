import { ProgressTracker } from '@/components/ProgressTracker';
import { SiteHeader } from '@/components/site-header';

type ProgressPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
  }>;
};

function normalizeMode(value?: string): 'lite' | 'deep' {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '我的';
  const mode = normalizeMode(params.mode);
  const title = params.goal?.trim() ? `${goal} 学习进度` : '我的学习进度';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <ProgressTracker goal={goal} mode={mode} title={title} />
    </main>
  );
}

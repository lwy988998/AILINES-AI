import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { ProgressTracker } from '@/components/ProgressTracker';
import { SiteHeader } from '@/components/site-header';
import { getProgressStagesByGoal } from '@/lib/mockProgress';

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
  const progressStages = getProgressStagesByGoal(goal);
  const contextSummary = progressStages
    .slice(0, 5)
    .map((stage, index) => `阶段 ${index + 1}：${stage.title}，包含任务：${stage.tasks.slice(0, 4).map((task) => task.title).join('、')}`)
    .join('\n')
    .slice(0, 1000);

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <ProgressTracker goal={goal} mode={mode} title={title} />
      <FloatingAilinesChat
        pageType="progress"
        goal={goal}
        mode={mode}
        contextTitle={title}
        contextSummary={contextSummary}
      />
    </main>
  );
}

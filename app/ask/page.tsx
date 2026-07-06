import { AskClient } from '@/components/AskClient';
import { SiteHeader } from '@/components/site-header';

type AskPageProps = {
  searchParams: Promise<{
    goal?: string;
    question?: string;
  }>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '学习';
  const question = params.question?.trim() || '';
  const title = question ? 'AI 问答' : params.goal?.trim() ? `${goal} 学习问答` : '学习问答';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <AskClient goal={goal} title={title} initialQuestion={question} />
    </main>
  );
}

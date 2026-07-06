import { AskHeader } from '@/components/AskHeader';
import { AskInput } from '@/components/AskInput';
import { ChatMessageList } from '@/components/ChatMessageList';
import { QuestionExamples } from '@/components/QuestionExamples';
import { SiteHeader } from '@/components/site-header';
import { generateAskAnswerWithAI } from '@/lib/ai/generateAskAnswer';
import { getMockAnswer, type ChatMessage } from '@/lib/mockAnswers';

export const dynamic = 'force-dynamic';

type AskPageProps = {
  searchParams: Promise<{
    goal?: string;
    question?: string;
  }>;
};

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '学习';
  const question = params.question?.trim() || '';
  const title = question ? 'AI 问答' : params.goal?.trim() ? `${goal} 学习问答` : '学习问答';
  const messages: ChatMessage[] = [];

  if (question) {
    messages.push({
      id: createMessageId('user'),
      role: 'user',
      content: question,
    });

    try {
      const answer = await generateAskAnswerWithAI(goal, question);
      messages.push({
        id: createMessageId('assistant'),
        role: 'assistant',
        content: '',
        answer,
      });
    } catch {
      messages.push({
        id: createMessageId('assistant'),
        role: 'assistant',
        content: '',
        error: 'AI 问答暂时不可用，已展示基础示例回答。',
        answer: getMockAnswer(question),
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AskHeader goal={goal} title={title} />
        {question ? (
          <section className="rounded-3xl border border-sky-100 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm shadow-sky-900/5 sm:p-5">
            当前问题：{question}
          </section>
        ) : null}
        {question ? null : <QuestionExamples goal={goal} />}
        <ChatMessageList messages={messages} />
        <AskInput goal={goal} defaultQuestion={question} />
      </div>
    </main>
  );
}

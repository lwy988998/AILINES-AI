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
    mode?: string;
  }>;
};

function normalizeMode(value?: string): 'lite' | 'deep' {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '学习';
  const question = params.question?.trim() || '';
  const mode = normalizeMode(params.mode);
  const modeLabel = mode === 'lite' ? '快速规划' : '深度 AILINES AI 规划';
  const title = question ? 'AILINES AI 问答' : params.goal?.trim() ? `${goal} 学习问答` : '学习问答';
  const messages: ChatMessage[] = [];

  if (question) {
    messages.push({
      id: createMessageId('user'),
      role: 'user',
      content: question,
    });

    try {
      const answer = await generateAskAnswerWithAI(goal, question, mode);
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
        error: 'AILINES AI 问答暂时不可用，已展示基础示例回答。',
        answer: getMockAnswer(question),
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AskHeader goal={goal} title={title} />
        <section className="rounded-3xl border border-sky-100 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm shadow-sky-900/5 sm:p-5">
          <p>当前模式：{modeLabel}</p>
          {question ? <p className="mt-2">当前问题：{question}</p> : null}
        </section>
        {question ? null : <QuestionExamples goal={goal} />}
        <ChatMessageList messages={messages} />
        <AskInput goal={goal} defaultQuestion={question} mode={mode} />
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { AskHeader } from '@/components/AskHeader';
import { AskInput } from '@/components/AskInput';
import { ChatMessageList } from '@/components/ChatMessageList';
import { QuestionExamples } from '@/components/QuestionExamples';
import { ChatMessage, getMockAnswer, type AskAnswer } from '@/lib/mockAnswers';

type AskClientProps = {
  goal: string;
  title: string;
};

type AskApiResponse = {
  answer?: AskAnswer;
  error?: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AskClient({ goal, title }: AskClientProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  async function sendQuestion(question = inputValue) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) {
      return;
    }

    const assistantMessageId = createMessageId();
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedQuestion,
    };
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      pending: true,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal, question: trimmedQuestion }),
      });
      const data = (await response.json()) as AskApiResponse;

      if (!response.ok || !data.answer) {
        throw new Error(data.error || 'AI 问答暂时不可用，已展示基础示例回答。');
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                pending: false,
                answer: data.answer,
              }
            : message,
        ),
      );
    } catch (error) {
      const fallbackAnswer = getMockAnswer(trimmedQuestion);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                pending: false,
                error: 'AI 问答暂时不可用，已展示基础示例回答。',
                answer: fallbackAnswer,
              }
            : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AskHeader goal={goal} title={title} />
      <QuestionExamples onSelectQuestion={sendQuestion} />
      <ChatMessageList messages={messages} />
      <AskInput value={inputValue} onChange={setInputValue} onSend={() => sendQuestion()} disabled={isSending} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { AskHeader } from '@/components/AskHeader';
import { AskInput } from '@/components/AskInput';
import { ChatMessageList } from '@/components/ChatMessageList';
import { QuestionExamples } from '@/components/QuestionExamples';
import { ChatMessage, getMockAnswer } from '@/lib/mockAnswers';

type AskClientProps = {
  goal: string;
  title: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AskClient({ goal, title }: AskClientProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function sendQuestion(question = inputValue) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedQuestion,
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      answer: getMockAnswer(trimmedQuestion),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
    setInputValue('');
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AskHeader goal={goal} title={title} />
      <QuestionExamples onSelectQuestion={sendQuestion} />
      <ChatMessageList messages={messages} />
      <AskInput value={inputValue} onChange={setInputValue} onSend={() => sendQuestion()} />
    </div>
  );
}

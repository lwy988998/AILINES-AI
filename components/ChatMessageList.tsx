'use client';

import { Copy } from 'lucide-react';
import type { ChatMessage } from '@/lib/mockAnswers';

type ChatMessageListProps = {
  messages: ChatMessage[];
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      alert('已复制');
    } catch {
      alert('复制失败，请手动复制');
    }
  }

  if (messages.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">还没有问题</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">你可以点击示例问题，或在下方输入学习中遇到的具体问题。</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-6">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <article key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[92%] rounded-3xl px-5 py-4 sm:max-w-[78%] ${
                isUser ? 'bg-sky-700 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap text-sm leading-6 sm:text-base">{message.content}</p>
              ) : (
                <div className="space-y-3">
                  {message.pending ? <p className="text-sm leading-6 text-slate-600">AI 正在回答，请稍候...</p> : null}
                  {message.error ? <p className="text-sm leading-6 text-amber-700">{message.error}</p> : null}
                  {message.answer?.title ? <h3 className="text-base font-semibold text-slate-950">{message.answer.title}</h3> : null}
                  {message.answer?.steps.length ? (
                    <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                      {message.answer.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                  {message.answer?.tips.length ? (
                    <div className="rounded-2xl border border-sky-100 bg-white p-3">
                      <p className="text-xs font-semibold text-sky-800">提示</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                        {message.answer.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {message.answer?.commands.map((command) => (
                    <div key={command} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
                        <span className="text-xs font-semibold text-slate-300">可复制命令</span>
                        <button
                          type="button"
                          onClick={() => copyCommand(command)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </button>
                      </div>
                      <pre className="overflow-x-auto px-4 py-3 text-sm leading-6 text-sky-100"><code>{command}</code></pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

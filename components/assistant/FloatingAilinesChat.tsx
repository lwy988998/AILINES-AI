"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronDown, ExternalLink, Loader2, Send, X } from 'lucide-react';

type PageType = 'plan' | 'phase' | 'progress' | 'learn' | 'home' | 'unknown';
type PlanMode = 'lite' | 'deep';

type ChatReference = {
  title: string;
  source: string;
  url: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  references?: ChatReference[];
  fallbackUsed?: boolean;
};

type FloatingAilinesChatProps = {
  pageType: PageType;
  goal?: string;
  mode?: PlanMode;
  phaseName?: string;
  topic?: string;
  contextTitle?: string;
  contextSummary?: string;
};

function truncateText(value: string | undefined, maxLength: number) {
  const text = value?.trim() || '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function getContextLabel(pageType: PageType) {
  switch (pageType) {
    case 'plan':
      return '当前学习方案';
    case 'phase':
      return '当前阶段';
    case 'progress':
      return '当前进度';
    case 'learn':
      return '当前课程';
    case 'home':
      return '首页';
    default:
      return '当前页面';
  }
}

function createStorageKey(props: FloatingAilinesChatProps) {
  return `ailines-floating-chat:${props.pageType}:${props.goal || ''}:${props.mode || 'deep'}:${props.phaseName || ''}:${props.topic || ''}:${props.contextTitle || ''}`;
}

function safeParseMessages(value: string | null): ChatMessage[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized: ChatMessage[] = [];

    for (const item of parsed) {
      const record = item && typeof item === 'object' ? item as Partial<ChatMessage> : {};
      if ((record.role !== 'user' && record.role !== 'assistant') || typeof record.content !== 'string') continue;
      const references = Array.isArray(record.references)
        ? record.references.filter((reference) => reference && typeof reference.title === 'string' && typeof reference.url === 'string').slice(0, 3)
        : undefined;
      normalized.push({ role: record.role, content: record.content, references, fallbackUsed: Boolean(record.fallbackUsed) });
    }

    return normalized.slice(-20);
  } catch {
    return [];
  }
}

export function FloatingAilinesChat(props: FloatingAilinesChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const storageKey = useMemo(() => createStorageKey(props), [props]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const contextLabel = getContextLabel(props.pageType);
  const contextTitle = props.contextTitle || props.topic || props.phaseName || props.goal || '当前课程';
  const contextSummary = truncateText(props.contextSummary, 180);

  useEffect(() => {
    setMessages(safeParseMessages(window.localStorage.getItem(storageKey)));
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
    } catch {
      // localStorage 失败时仅保留当前会话。
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isOpen, isSending]);

  async function sendMessage() {
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-20);
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/learning-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          pageType: props.pageType,
          goal: props.goal,
          mode: props.mode || 'deep',
          phaseName: props.phaseName,
          topic: props.topic,
          contextTitle: props.contextTitle,
          contextSummary: props.contextSummary,
          messages: nextMessages.slice(-8),
        }),
      });

      const data = await response.json().catch(() => ({})) as { answer?: unknown; references?: unknown; fallbackUsed?: unknown };
      const answer = typeof data.answer === 'string' && data.answer.trim()
        ? data.answer.trim()
        : '回答暂未生成完成。你可以稍后重试，或把问题补充得更具体后再次发送。';
      const references = Array.isArray(data.references)
        ? data.references.map((item) => {
          const record = item && typeof item === 'object' ? item as Partial<ChatReference> : {};
          return typeof record.title === 'string' && typeof record.url === 'string'
            ? { title: record.title, source: record.source || '参考资料', url: record.url }
            : null;
        }).filter((item): item is ChatReference => Boolean(item)).slice(0, 3)
        : [];

      const assistantMessage: ChatMessage = { role: 'assistant', content: answer, references, fallbackUsed: Boolean(data.fallbackUsed) };
      setMessages((current) => [...current, assistantMessage].slice(-20));
    } catch {
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        content: '回答暂未生成完成。你可以稍后重试，或把问题补充得更具体后再次发送。',
        references: [],
        fallbackUsed: true,
      };
      setMessages((current) => [...current, fallbackMessage].slice(-20));
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 sm:bottom-6 sm:right-6"
        aria-label="打开 AILINES AI 学习助手"
      >
        <Bot className="h-5 w-5" />
        问 AILINES AI
      </button>
    );
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[70vh] w-[calc(100vw-1.5rem)] max-w-[460px] flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-2xl shadow-sky-950/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px]">
      <header className="border-b border-sky-100 bg-sky-700 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h2 className="text-base font-semibold">AILINES AI 学习助手</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-sky-50">{contextLabel}：{truncateText(contextTitle, 42)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-sky-50 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70" aria-label="收起对话框">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setMessages([])} className="rounded-full p-2 text-sky-50 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70" aria-label="清空当前对话">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-slate-700">
        <p className="font-semibold text-sky-900">我会结合当前页面语境回答，不脱离学习场景。</p>
        {contextSummary ? <p className="mt-1">{contextSummary}</p> : <p className="mt-1">可以直接问“这个阶段我应该先做什么？”</p>}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-4 text-sm leading-6 text-slate-600">
            试试问：这个阶段我应该先做什么？或者“这个概念是什么意思？”
          </div>
        ) : null}
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <article key={`${message.role}-${index}-${message.content.slice(0, 12)}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? 'bg-sky-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!isUser && message.references?.length ? (
                  <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600" open={false}>
                    <summary className="cursor-pointer font-semibold text-sky-800">参考资料</summary>
                    <div className="mt-2 space-y-2">
                      {message.references.slice(0, 3).map((reference) => (
                        <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 bg-white p-2 transition hover:border-sky-200 hover:bg-sky-50">
                          <span className="block font-semibold text-slate-900">{reference.title}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-sky-700">{reference.source || '参考资料'} · 打开 <ExternalLink className="h-3 w-3" /></span>
                        </a>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </article>
          );
        })}
        {isSending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
              AILINES AI 正在结合当前页面思考...
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="输入你的问题，Enter 发送"
            className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isSending || !input.trim()}
            className="inline-flex min-h-12 w-14 items-center justify-center rounded-2xl bg-sky-700 text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="发送问题"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">Shift + Enter 换行</p>
      </div>
    </aside>
  );
}

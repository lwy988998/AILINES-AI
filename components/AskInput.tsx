'use client';

import { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type AskInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function AskInput({ value, onChange, onSend }: AskInputProps) {
  const canSend = value.trim().length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  }

  return (
    <section className="sticky bottom-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-lg shadow-sky-900/10 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label htmlFor="ask-input" className="sr-only">
          输入你的问题
        </label>
        <textarea
          id="ask-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="请输入你遇到的问题，例如：Python 怎么安装？"
          className="min-h-24 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          <Send className="h-4 w-4" />
          发送
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Enter 发送，Shift + Enter 换行。</p>
    </section>
  );
}

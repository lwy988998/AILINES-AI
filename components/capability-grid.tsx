import { BookOpen, Boxes, CheckCircle2, FolderGit2, HelpCircle, Route } from 'lucide-react';
import { capabilityItems } from '@/lib/examples';

const icons = [Route, BookOpen, FolderGit2, Boxes, HelpCircle, CheckCircle2];

export function CapabilityGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">MVP 能力摘要</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">从目标到行动计划</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          当前版本先完成入口与页面骨架，后续可以逐步接入 AILINES AI 生成、账户、会员和进度数据。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilityItems.map((item, index) => {
          const Icon = icons[index];
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/10"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

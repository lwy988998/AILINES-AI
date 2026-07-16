import { ExternalLink } from 'lucide-react';
import type { ResourceItem } from '@/lib/mockPlan';

type ResourcesSectionProps = {
  resources: ResourceItem[];
};

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">开源资源</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">先用免费资源建立能力闭环</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <article key={resource.name} className="min-w-0 flex flex-col rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">{resource.type}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{resource.difficulty}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {resource.free ? '免费' : '付费'}
              </span>
            </div>
            <h3 className="mt-4 break-words text-lg font-semibold text-slate-950">{resource.name}</h3>
            <p className="mt-2 flex-1 break-words text-sm leading-6 text-slate-600">{resource.description}</p>
            <a
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
            >
              查看资源
              <ExternalLink className="h-4 w-4" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

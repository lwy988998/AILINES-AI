import { ClipboardCheck } from 'lucide-react';
import type { ProjectItem } from '@/lib/mockPlan';

type ProjectsSectionProps = {
  projects: ProjectItem[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">项目实战路径</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">用作品验证学习成果</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <article key={project.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800">{project.difficulty}</span>
              <span className="text-sm font-medium text-slate-500">{project.duration}</span>
            </div>
            <h3 className="break-words text-lg font-semibold text-slate-950">{project.name}</h3>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">项目产出</p>
                <p className="mt-1">{project.output}</p>
              </div>
              <div>
                <p className="flex items-center gap-2 font-semibold text-slate-800">
                  <ClipboardCheck className="h-4 w-4 text-sky-700" />
                  验收标准
                </p>
                <p className="mt-1">{project.acceptance}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

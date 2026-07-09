import { Network } from 'lucide-react';
import type { CourseMindMap, MindMapNode, RoadmapStage } from '@/lib/mockPlan';

type CourseMindMapProps = {
  mindMap?: CourseMindMap;
  phases?: RoadmapStage[];
  title?: string;
  description?: string;
};

function slug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ascii || fallback;
}

function mindMapFromPhases(phases?: RoadmapStage[]): CourseMindMap {
  const safePhases = Array.isArray(phases) ? phases : [];
  return {
    title: '课程知识结构',
    nodes: [
      {
        id: 'root',
        label: 'AILINES AI 课程',
        children: safePhases.length
          ? safePhases.slice(0, 6).map((phase, index) => ({
              id: slug(phase.name || '', `phase-${index + 1}`),
              label: phase.name || `阶段 ${index + 1}`,
              children: (Array.isArray(phase.steps) && phase.steps.length > 0
                ? phase.steps.map((step) => step.title.replace(/^第\s*\d+\s*步[:：]?\s*/, ''))
                : [phase.goal, phase.output, phase.checkpoint]
              )
                .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                .slice(0, 5)
                .map((label, childIndex) => ({ id: `${slug(phase.name || '', `phase-${index + 1}`)}-${childIndex + 1}`, label })),
            }))
          : [
              { id: 'structure', label: '课程结构' },
              { id: 'steps', label: '分步学习' },
              { id: 'practice', label: '练习检查' },
            ],
      },
    ],
  };
}

function normalizeNodes(mindMap?: CourseMindMap, phases?: RoadmapStage[]) {
  const source = mindMap && Array.isArray(mindMap.nodes) && mindMap.nodes.length > 0 ? mindMap : mindMapFromPhases(phases);
  return {
    title: source.title || '课程知识结构',
    nodes: source.nodes,
  };
}

function NodeCard({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  const children = Array.isArray(node.children) ? node.children : [];
  const colorClass = depth === 0 ? 'border-sky-300 bg-sky-700 text-white' : depth === 1 ? 'border-sky-200 bg-sky-50 text-sky-950' : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className="min-w-0">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${colorClass}`}>{node.label || '知识点'}</div>
      {children.length > 0 ? (
        <div className={`mt-3 grid gap-3 ${depth === 0 ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
          {children.map((child, index) => (
            <div key={child.id || `${node.id}-${index}`} className="relative pl-4">
              <span className="absolute left-0 top-5 h-px w-3 bg-sky-200" />
              <NodeCard node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CourseMindMap({ mindMap, phases, title = '课程思维导图', description = '从整体结构理解知识点之间的关系。' }: CourseMindMapProps) {
  const prepared = normalizeNodes(mindMap, phases);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Network className="h-4 w-4" />知识结构图</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-sky-50 p-4 sm:p-6">
        <div className="min-w-[280px] space-y-4">
          <p className="text-sm font-semibold text-slate-500">{prepared.title}</p>
          {prepared.nodes.map((node, index) => <NodeCard key={node.id || `root-${index}`} node={node} />)}
        </div>
      </div>
    </section>
  );
}

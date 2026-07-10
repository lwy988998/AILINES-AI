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

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
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
          ? safePhases.slice(0, 6).map((phase, index) => {
              const phaseId = slug(phase.name || '', `phase-${index + 1}`);
              const sourceChildren = Array.isArray(phase.steps) && phase.steps.length > 0
                ? phase.steps.map((step) => step.title.replace(/^第\s*\d+\s*步[:：]?\s*/, ''))
                : [phase.goal, phase.output, phase.checkpoint];

              return {
                id: phaseId,
                label: phase.name || `阶段 ${index + 1}`,
                children: sourceChildren
                  .filter(isNonEmptyText)
                  .slice(0, 5)
                  .map((label, childIndex) => ({ id: `${phaseId}-${childIndex + 1}`, label })),
              };
            })
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
    nodes: source.nodes.filter((node) => isNonEmptyText(node.label)),
  };
}

function nodeClasses(depth: number) {
  if (depth === 0) {
    return 'border-sky-300 bg-sky-700 text-white shadow-sky-900/20';
  }

  if (depth === 1) {
    return 'border-sky-200 bg-white text-sky-950 shadow-sky-900/10';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700 shadow-slate-900/5';
}

function NodeCard({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  const children = Array.isArray(node.children) ? node.children.filter((child) => isNonEmptyText(child.label)) : [];
  const isRoot = depth === 0;
  const isPhase = depth === 1;

  return (
    <div className="min-w-0">
      <div className={`relative min-w-0 break-words rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${nodeClasses(depth)} ${isRoot ? 'mx-auto max-w-xl text-center text-base sm:text-lg' : ''}`}>
        {node.label || '知识点'}
      </div>

      {children.length > 0 ? (
        <div className={isRoot ? 'relative mt-6' : 'relative mt-3 pl-5'}>
          {isRoot ? <div className="absolute left-1/2 top-0 hidden h-6 w-px -translate-x-1/2 -translate-y-6 bg-sky-200 lg:block" /> : <div className="absolute left-0 top-0 h-full w-px bg-sky-100" />}
          <div className={isRoot ? 'grid gap-4 lg:grid-cols-3' : 'space-y-3'}>
            {children.map((child, index) => (
              <div key={child.id || `${node.id}-${index}`} className="relative min-w-0">
                {isRoot ? (
                  <span className="absolute left-1/2 top-0 hidden h-4 w-px -translate-x-1/2 -translate-y-4 bg-sky-200 lg:block" />
                ) : (
                  <span className="absolute -left-5 top-6 h-px w-5 bg-sky-100" />
                )}
                <div className={isPhase ? 'rounded-2xl border border-sky-100 bg-sky-50/60 p-3' : ''}>
                  <NodeCard node={child} depth={depth + 1} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CourseMindMap({ mindMap, phases, title = '课程思维导图', description = '从整体结构理解知识点之间的关系。' }: CourseMindMapProps) {
  const prepared = normalizeNodes(mindMap, phases);
  const nodes = prepared.nodes.length > 0 ? prepared.nodes : mindMapFromPhases(phases).nodes;

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Network className="h-4 w-4" />知识结构图</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-sky-50 p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">{prepared.title}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-sky-700 px-3 py-1 text-white">课程</span>
            <span className="rounded-full bg-white px-3 py-1 text-sky-800">阶段</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">知识点</span>
          </div>
        </div>
        <div className="min-w-0 space-y-8">
          {nodes.map((node, index) => <NodeCard key={node.id || `root-${index}`} node={node} />)}
        </div>
      </div>
    </section>
  );
}

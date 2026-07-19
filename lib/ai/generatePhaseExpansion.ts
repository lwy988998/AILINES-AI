import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { PlanMode } from '@/lib/ai/types';
import { markCourseContentSource } from '@/lib/courseContentSource';
import { validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import type { CourseSlide, RoadmapStage } from '@/lib/mockPlan';
import type { SearchResource } from '@/lib/search/resourceTypes';
import type { PhaseStep, PhaseTask } from '@/lib/mockPhaseDetail';

const DEFAULT_PHASE_TIMEOUT_MS = 35_000;

type PhaseExpansion = {
  objective: string;
  overview: string;
  steps: PhaseStep[];
  tasks: PhaseTask[];
  slides: CourseSlide[];
  knowledgeTopics: string[];
  checklist: string[];
  commonMistakes: string[];
};

function timeoutMs() {
  const configured = Number(process.env.AI_PHASE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : getAIRequestTimeoutMs(DEFAULT_PHASE_TIMEOUT_MS);
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function arr(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function briefResources(resources: SearchResource[]) {
  return resources.slice(0, 5).map((r) => ({ title: r.title.slice(0, 120), source: r.source.slice(0, 80), description: r.description.slice(0, 280), url: r.url, type: r.type }));
}

function messages(input: { goal: string; mode: PlanMode; phaseIndex: number; stage: RoadmapStage; topics: string[]; resources: SearchResource[] }) {
  return [
    { role: 'system' as const, content: '你是 AILINES AI 阶段课程设计师。当前是 Level 2：Phase Expansion。只展开当前阶段，不生成全课程，不写长教材。输出严格 JSON。不要 mock/fallback/demo/template。资料只做参考，不要把链接列表当正文。' },
    { role: 'user' as const, content: JSON.stringify({
      task: '根据课程骨架中的当前阶段，生成阶段导学、分步讲解、任务卡片、轻量课件和验收清单。',
      goal: input.goal,
      mode: input.mode,
      phaseIndex: input.phaseIndex,
      phase: input.stage,
      topics: input.topics,
      resources: briefResources(input.resources),
      rules: [
        '只展开当前 phase；不要补全其他阶段。',
        'steps 必须围绕 topics，一般 3-6 个；每步 explanation 60-120 字，action/check 具体可执行。',
        'tasks 2-5 个，必须有 duration/description/output。',
        'slides 3-5 张轻量课件，只写阶段内关键点。',
        'knowledgeTopics 只列当前阶段知识结构节点。',
        '不要输出泛化句：深入学习相关知识、掌握基本概念、多加练习、提升综合能力。',
      ],
      outputSchema: { objective: 'string', overview: 'string', steps: [{ title: 'string', explanation: 'string', example: 'string', action: 'string', check: 'string' }], tasks: [{ title: 'string', duration: 'string', description: 'string', output: 'string' }], slides: [{ title: 'string', subtitle: 'string', content: 'string', bullets: ['string'], speakerNote: 'string', relatedPhase: 'string' }], knowledgeTopics: ['string'], checklist: ['string'], commonMistakes: ['string'] },
    }) },
  ];
}

function adapt(raw: unknown, stage: RoadmapStage): PhaseExpansion {
  const r = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const steps = arr(r.steps).map((item, index) => {
    const s = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { title: text(s.title, `${stage.tasks?.[index] || stage.name}`), explanation: text(s.explanation), example: text(s.example), action: text(s.action), check: text(s.check) };
  }).filter((s) => s.title && s.explanation && s.action && s.check).slice(0, 6);
  const tasks = arr(r.tasks).map((item) => {
    const t = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { title: text(t.title), duration: text(t.duration, '30-60 分钟'), description: text(t.description), output: text(t.output) };
  }).filter((t) => t.title && t.description && t.output).slice(0, 5);
  const slides = arr(r.slides).map((item) => {
    const s = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { title: text(s.title), subtitle: text(s.subtitle, stage.name), content: text(s.content), bullets: arr(s.bullets).map((x) => text(x)).filter(Boolean).slice(0, 4), speakerNote: text(s.speakerNote), relatedPhase: text(s.relatedPhase, stage.name) };
  }).filter((s) => s.title && s.content).slice(0, 5);
  return markCourseContentSource({ objective: text(r.objective, stage.goal), overview: text(r.overview, stage.description), steps, tasks, slides, knowledgeTopics: arr(r.knowledgeTopics).map((x) => text(x)).filter(Boolean).slice(0, 8), checklist: arr(r.checklist).map((x) => text(x)).filter(Boolean).slice(0, 8), commonMistakes: arr(r.commonMistakes).map((x) => text(x)).filter(Boolean).slice(0, 6) }, 'ai');
}

export async function generatePhaseExpansion(input: { goal: string; mode: PlanMode; phaseIndex: number; stage: RoadmapStage; topics: string[]; resources: SearchResource[] }): Promise<PhaseExpansion | null> {
  try {
    const content = await createChatCompletion({ purpose: 'ask', messages: messages(input), temperature: input.mode === 'lite' ? 0.25 : 0.3, maxTokens: input.mode === 'lite' ? 2200 : 3200, responseFormat: 'json_object', timeoutMs: timeoutMs(), maxAttempts: 1 });
    const expansion = adapt(parseAIJson<unknown>(content), input.stage);
    const validation = validateUserVisibleCourseContent({ ...expansion, phases: [{ ...input.stage, topics: input.topics, steps: expansion.steps, tasks: expansion.tasks.map((task) => task.title), output: input.stage.output, checkpoint: input.stage.checkpoint }] }, { goal: input.goal, mode: input.mode, phaseName: input.stage.name, availableTopics: input.topics, availableTasks: expansion.tasks.map((task) => task.title) });
    if (!validation.valid || expansion.steps.length === 0) throw new AIClientError('invalid_response', 'phase expansion quality gate failed');
    return expansion;
  } catch (error) {
    const safe = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI phase expansion unavailable', { errorType: safe.type, status: safe.status, mode: input.mode, phaseIndex: input.phaseIndex });
    return null;
  }
}

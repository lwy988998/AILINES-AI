import type { GeneratedCourseSlide, GeneratedMindMap, GeneratedMindMapNode, GeneratedPlan, GeneratedPlanPhase, GeneratedPlanStep } from '@/lib/ai/types';
import type { CourseMindMap, CourseSlide, CourseStep, MockPlan } from '@/lib/mockPlan';

function ensureArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}


function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function slug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (ascii) return ascii.slice(0, 48);
  return fallback;
}

function adaptSlide(slide: GeneratedCourseSlide, index: number): CourseSlide {
  return {
    title: safeText(slide.title, `课程课件 ${index + 1}`),
    subtitle: safeText(slide.subtitle, ''),
    content: safeText(slide.content, '围绕本页主题理解核心概念，并通过练习完成掌握检查。'),
    bullets: ensureArray(slide.bullets).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    speakerNote: safeText(slide.speakerNote, ''),
    relatedPhase: safeText(slide.relatedPhase, ''),
  };
}

function slidesFromPhases(plan: GeneratedPlan, phases: GeneratedPlanPhase[]): CourseSlide[] {
  const slides: CourseSlide[] = [
    {
      title: '课程导入',
      subtitle: safeText(plan.goal, '学习目标'),
      content: safeText(plan.courseIntro, safeText(plan.overview, safeText(plan.summary, '本课程会把目标拆成阶段、步骤、练习和检查点。'))),
      bullets: ensureArray(plan.learningOutcomes).slice(0, 4).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
      speakerNote: '先建立课程全局认知，再进入阶段学习；每一阶段都要完成练习和检查点。',
    },
  ];

  phases.forEach((phase, phaseIndex) => {
    const phaseName = safeText(phase.name, `阶段 ${phaseIndex + 1}`);
    slides.push({
      title: phaseName,
      subtitle: safeText(phase.objective, '阶段目标'),
      content: safeText(phase.overview, safeText(phase.description, '理解本阶段关键知识，并完成可检查的练习。')),
      bullets: [safeText(phase.duration, ''), safeText(phase.output, ''), safeText(phase.checkpoint, '')].filter(Boolean),
      speakerNote: safeText(phase.why, '说明这一阶段为什么重要，并提醒用户做完检查点再进入下一阶段。'),
      relatedPhase: phaseName,
    });

    ensureArray(phase.steps).slice(0, 2).forEach((step, stepIndex) => {
      slides.push({
        title: safeText(step.title, `第 ${stepIndex + 1} 步`),
        subtitle: phaseName,
        content: safeText(step.explanation, safeText(phase.description, '先理解本步骤，再完成行动建议。')),
        bullets: [safeText(step.example, ''), `现在你要做：${safeText(step.action, '完成一个小练习')}`, `完成检查：${safeText(step.check, '能独立复现并解释')}`].filter(Boolean),
        speakerNote: '这一页按“讲解—例子—行动—检查”的顺序带用户学习。',
        relatedPhase: phaseName,
      });
    });
  });

  return slides.slice(0, 12);
}

function adaptNode(node: GeneratedMindMapNode, fallback: string): CourseMindMap['nodes'][number] {
  return {
    id: safeText(node.id, fallback),
    label: safeText(node.label, '知识点'),
    children: ensureArray(node.children).map((child, index) => adaptNode(child, `${fallback}-${index + 1}`)),
  };
}

function mindMapFromPhases(plan: GeneratedPlan, phases: GeneratedPlanPhase[]): CourseMindMap {
  const rootLabel = safeText(plan.goal, safeText(plan.title, 'AILINES AI 课程'));
  return {
    title: '课程知识结构',
    nodes: [
      {
        id: 'root',
        label: rootLabel,
        children: phases.slice(0, 6).map((phase, index) => {
          const phaseName = safeText(phase.name, `阶段 ${index + 1}`);
          const labels = ensureArray(phase.steps).length > 0
            ? ensureArray(phase.steps).map((step) => safeText(step.title, '学习步骤').replace(/^第\s*\d+\s*步[:：]?\s*/, ''))
            : ensureArray(phase.topics);
          return {
            id: slug(phaseName, `phase-${index + 1}`),
            label: phaseName,
            children: labels.slice(0, 5).map((label, childIndex) => ({ id: `${slug(phaseName, `phase-${index + 1}`)}-${childIndex + 1}`, label })),
          };
        }),
      },
    ],
  };
}

function adaptStep(step: GeneratedPlanStep, index: number, phase: GeneratedPlanPhase): CourseStep {
  return {
    title: safeText(step.title, `第 ${index + 1} 步：${safeText(phase.name, '理解本阶段重点')}`),
    explanation: safeText(step.explanation, safeText(phase.description, '先理解本阶段核心概念，再通过练习把知识转成可执行能力。')),
    example: safeText(step.example, ''),
    action: safeText(step.action, '完成本步骤对应练习，并记录遇到的问题。'),
    check: safeText(step.check, '能用自己的话解释本步骤，并独立完成一个小练习。'),
  };
}

function phaseTasks(phase: GeneratedPlanPhase) {
  const tasks = ensureArray(phase.tasks).filter((task): task is string => typeof task === 'string' && task.trim().length > 0);
  if (tasks.length > 0) return tasks;
  return ensureArray(phase.topics).slice(0, 5);
}

export function adaptGeneratedPlan(plan: GeneratedPlan, mode: 'lite' | 'deep' = 'deep'): MockPlan {
  const phases = ensureArray(plan.phases);
  const titleFallback = mode === 'lite' ? `${safeText(plan.goal, '你的目标')}快速学习方案` : 'AILINES AI 学习方案';
  const summaryFallback = mode === 'lite' ? '这是一份快速可执行方案，优先给出核心步骤、练习方法、检查标准和常见错误。' : '围绕你的目标生成阶段化学习路线。';

  return {
    title: safeText(plan.title, titleFallback),
    duration: mode === 'lite' ? `${typeof plan.durationWeeks === 'number' ? Math.max(1, Math.min(2, plan.durationWeeks)) : 1} 周` : `${typeof plan.durationWeeks === 'number' ? plan.durationWeeks : phases.length * 2} 周`,
    summary: safeText(plan.summary, safeText(plan.courseIntro || plan.overview, summaryFallback)),
    courseIntro: safeText(plan.courseIntro, safeText(plan.overview || plan.summary, mode === 'lite' ? '这份快速规划会用更少步骤告诉你马上怎么做、怎么练、怎么检查。' : '这门课程会通过阶段导学、分步讲解、练习和检查点帮助你真正掌握目标。')),
    overview: safeText(plan.overview, safeText(plan.summary, mode === 'lite' ? '从准备、核心步骤、练习、自检和常见错误快速推进。' : '从目标拆解、核心知识、练习任务到阶段产出，逐步推进学习。')),
    audience: safeText(plan.audience, mode === 'lite' ? '希望快速上手并获得可执行步骤的学习者。' : '希望系统学习并通过练习获得实际产出的学习者。'),
    prerequisites: ensureArray(plan.prerequisites).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    outcome: safeText(plan.outcome, '完成后能够形成可展示的学习成果，并知道下一步如何继续提升。'),
    learningOutcomes: isStringArray(plan.learningOutcomes) ? plan.learningOutcomes : [],
    slides: ensureArray(plan.slides).length > 0 ? ensureArray(plan.slides).map(adaptSlide) : slidesFromPhases(plan, phases),
    mindMap: plan.mindMap && Array.isArray(plan.mindMap.nodes) ? { title: safeText(plan.mindMap.title, '课程知识结构'), nodes: plan.mindMap.nodes.map((node, index) => adaptNode(node, `node-${index + 1}`)) } : mindMapFromPhases(plan, phases),
    roadmap: phases.map((phase, index) => ({
      name: safeText(phase.name, `阶段${index + 1}`),
      duration: safeText(phase.duration, `${typeof phase.durationWeeks === 'number' ? phase.durationWeeks : 2} 周`),
      goal: safeText(phase.objective, '掌握本阶段核心能力'),
      description: safeText(phase.description || phase.overview, '完成关键知识学习、练习和阶段产出。'),
      why: safeText(phase.why, ''),
      output: safeText(phase.output, ''),
      practice: safeText(phase.practice, ''),
      checkpoint: safeText(phase.checkpoint, ''),
      commonMistakes: ensureArray(phase.commonMistakes).filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
      steps: ensureArray(phase.steps).map((step, stepIndex) => adaptStep(step, stepIndex, phase)),
    })),
    courseStructure: phases.map((phase) => ({
      stage: safeText(phase.name, '学习阶段'),
      topics: ensureArray(phase.topics).length > 0 ? ensureArray(phase.topics) : phaseTasks(phase),
    })),
    resources: ensureArray(plan.resources).map((resource) => ({
      name: safeText(resource.name, '学习资源'),
      type: resource.type as MockPlan['resources'][number]['type'],
      difficulty: resource.difficulty as MockPlan['resources'][number]['difficulty'],
      free: Boolean(resource.free),
      description: safeText(resource.description, '适合作为当前目标的补充学习资料。'),
      href: safeText(resource.url, '#'),
    })),
    projects: ensureArray(plan.projects).map((project) => ({
      name: safeText(project.name, '阶段实践项目'),
      difficulty: project.difficulty as MockPlan['projects'][number]['difficulty'],
      duration: `${typeof project.estimatedHours === 'number' ? project.estimatedHours : 4} 小时`,
      output: safeText(project.output, '一个可检查的练习成果。'),
      acceptance: ensureArray(project.acceptanceCriteria).join('；') || '目标明确、过程可复盘、结果可展示。',
    })),
  };
}

export function isRenderablePlan(plan: MockPlan) {
  return Boolean(
    plan.title &&
      plan.summary &&
      Array.isArray(plan.roadmap) &&
      plan.roadmap.length > 0 &&
      Array.isArray(plan.courseStructure) &&
      plan.courseStructure.length > 0 &&
      Array.isArray(plan.resources) &&
      plan.resources.length > 0 &&
      Array.isArray(plan.projects) &&
      plan.projects.length > 0,
  );
}

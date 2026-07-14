import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { PlanMode } from '@/lib/ai/types';
import { getMockLearningAnswer, referencesFromResources, type LearningAnswer, type LearningExample, type LearningLessonStep, type LearningPractice, type LearningQuizItem, type LearningReference } from '@/lib/learning/mockLearningAnswer';
import type { SearchResource } from '@/lib/search/resourceTypes';

const DEFAULT_LEARNING_TIMEOUT_MS = 25_000;

type GenerateLearningAnswerInput = {
  goal: string;
  phaseName: string;
  topic: string;
  mode: PlanMode;
  resources: SearchResource[];
};

type ResourceBrief = {
  title: string;
  source: string;
  description: string;
  url: string;
  type: string;
};

function getLearningTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_LEARNING_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : getAIRequestTimeoutMs(DEFAULT_LEARNING_TIMEOUT_MS);
}

function sanitizeText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function sanitizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => sanitizeText(item)).filter(Boolean);
  return items.length ? items : fallback;
}

function sanitizeLessonSteps(value: unknown, fallback: LearningLessonStep[]) {
  if (!Array.isArray(value)) return fallback;

  const steps = value.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      title: sanitizeText(record.title, `第 ${index + 1} 步：理解并练习`),
      explanation: sanitizeText(record.explanation, fallback[index % fallback.length]?.explanation || '先理解概念，再通过练习检查掌握程度。'),
      example: sanitizeText(record.example, fallback[index % fallback.length]?.example || '结合一个简单例子理解本步骤。'),
      action: sanitizeText(record.action, fallback[index % fallback.length]?.action || '完成一个小练习。'),
      check: sanitizeText(record.check, fallback[index % fallback.length]?.check || '能用自己的话解释并独立完成同类任务。'),
    };
  }).filter((step) => step.title && step.explanation);

  return steps.length ? steps : fallback;
}

function sanitizeExamples(value: unknown, fallback: LearningExample[]) {
  if (!Array.isArray(value)) return fallback;

  const examples = value.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      title: sanitizeText(record.title, fallback[index % fallback.length]?.title || '例题/案例'),
      content: sanitizeText(record.content, fallback[index % fallback.length]?.content || '围绕本主题完成一个案例。'),
      solution: sanitizeStringArray(record.solution, fallback[index % fallback.length]?.solution || ['分析题目或场景。', '分步骤完成。', '检查结果。']),
    };
  }).filter((example) => example.title && example.content);

  return examples.length ? examples : fallback;
}

function sanitizePractice(value: unknown, fallback: LearningPractice[]) {
  if (!Array.isArray(value)) return fallback;

  const practice = value.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      title: sanitizeText(record.title, fallback[index % fallback.length]?.title || '练习'),
      difficulty: sanitizeText(record.difficulty, fallback[index % fallback.length]?.difficulty || '入门'),
      task: sanitizeText(record.task, fallback[index % fallback.length]?.task || '完成一个围绕本主题的小练习。'),
      check: sanitizeText(record.check, fallback[index % fallback.length]?.check || '能说明过程和结果。'),
    };
  }).filter((item) => item.title && item.task);

  return practice.length ? practice : fallback;
}

function sanitizeQuiz(value: unknown, fallback: LearningQuizItem[] = []): LearningQuizItem[] {
  if (!Array.isArray(value)) return fallback;

  const quiz = value.map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const options = Array.isArray(record.options)
      ? record.options.map((option) => sanitizeText(option)).filter(Boolean)
      : [];
    const answerIndex = typeof record.answerIndex === 'number' ? record.answerIndex : Number.parseInt(String(record.answerIndex ?? ''), 10);

    if (options.length !== 4 || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) return null;

    return {
      question: sanitizeText(record.question),
      options,
      answerIndex,
      explanation: sanitizeText(record.explanation, '这道题用于检查你是否理解了本节课的关键概念和应用方式。'),
    };
  }).filter((item): item is LearningQuizItem => Boolean(item && item.question && item.explanation));

  return quiz.length ? quiz.slice(0, 5) : fallback;
}

function normalizeResources(resources: SearchResource[]): ResourceBrief[] {
  return resources.slice(0, 8).map((resource) => ({
    title: resource.title.slice(0, 120),
    source: resource.source.slice(0, 80),
    description: resource.description.slice(0, 500),
    url: resource.url,
    type: resource.type,
  }));
}

function filterReferences(value: unknown, resources: SearchResource[]): LearningReference[] {
  const allowedByUrl = new Map(resources.map((resource) => [resource.url, resource]));
  const fallbackReferences = referencesFromResources(resources);

  if (!Array.isArray(value)) return fallbackReferences;

  const references = value.map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const url = sanitizeText(record.url);
    const resource = allowedByUrl.get(url);
    if (!resource) return null;
    return {
      title: sanitizeText(record.title, resource.title),
      source: sanitizeText(record.source, resource.source),
      url: resource.url,
      type: sanitizeText(record.type, resource.type),
    };
  }).filter((item): item is LearningReference => Boolean(item));

  return references.length ? references : fallbackReferences;
}

function createLearningPromptMessages(input: GenerateLearningAnswerInput, resourceBriefs: ResourceBrief[]) {
  const stepRange = input.mode === 'lite' ? '3-4' : '5-6';
  const stepLength = input.mode === 'lite' ? '90-140' : '160-260';
  const practiceCount = input.mode === 'lite' ? '2-3' : '3-5';

  return [
    {
      role: 'system' as const,
      content: `你是 AILINES AI 学习导师。你已经拿到联网搜索资料摘要。你必须先理解、筛选、整合资料，再用自己的教学语言生成一节完整微课程。正文必须像老师讲课：为什么学 -> 是什么 -> 怎么用 -> 具体例子 -> 可执行练习 -> 小测验 -> 总结。不要直接复制资料，不要把搜索结果列表当正文，不要空泛鸡汤，不要只列大纲。references 必须只来自用户提供的 resources.url，且只放在最后参考资料。只输出严格 JSON。`,
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        task: '根据学习目标、阶段和学习点，生成资料整合后的高质量微课程。',
        teachingStyle: ['通俗、具体、像老师在讲课', '围绕 topic，不跑题', '适合目标人群，不拔高到不相关层级', '每段都要能帮助用户真正学会或完成练习'],
        avoid: ['深入学习相关知识', '掌握基本概念', '多加练习', '参考相关资料', '提升综合能力', '只给链接', '只列大纲'],
        requirements: {
          summary: '说明这节课解决什么问题、适合谁、学完能做什么。',
          keyConcepts: '3-6 个核心概念；每个概念名称要具体，不要空泛。',
          lessonSteps: `${stepRange} 步，每步 explanation ${stepLength} 字，必须包含 title/explanation/example/action/check；按“解释-例子-行动-检查”组织。`,
          examples: '至少 1-2 个强相关示例；数学/考试类要有题目和分步解法；编程类要有代码或调试步骤；摄影/设计类要有场景案例。',
          practice: `${practiceCount} 个练习，带难度梯度；task 要写清楚要做什么；check 要写可验证结果，可包含提示或参考答案。`,
          quiz: '3-5 道选择题；每题 4 个非空选项；answerIndex 必须唯一且和 explanation 一致；干扰项不能过于离谱。',
          commonMistakes: '3-5 个常见误区，必须和 topic 强相关。',
          checkpoint: '3-5 条可衡量学习目标/完成标准。',
          resourceSummary: '用一小段话说明你如何综合了资料摘要，不要罗列搜索结果。',
          references: '只能引用输入 resources 里的 title/source/url/type，不得新增链接。',
        },
        outputSchema: {
          title: 'string',
          summary: 'string',
          keyConcepts: ['string'],
          lessonSteps: [{ title: 'string', explanation: 'string', example: 'string', action: 'string', check: 'string' }],
          examples: [{ title: 'string', content: 'string', solution: ['string'] }],
          practice: [{ title: 'string', difficulty: 'string', task: 'string', check: 'string' }],
          quiz: [{ question: 'string', options: ['A', 'B', 'C', 'D'], answerIndex: 0, explanation: 'string' }],
          commonMistakes: ['string'],
          checkpoint: ['string'],
          resourceSummary: 'string',
          references: [{ title: 'string', source: 'string', url: 'string', type: 'string' }],
        },
        goal: input.goal,
        phaseName: input.phaseName,
        topic: input.topic,
        mode: input.mode,
        resources: resourceBriefs,
      }),
    },
  ];
}

function adaptLearningAnswer(rawAnswer: unknown, fallback: LearningAnswer, resources: SearchResource[]): LearningAnswer {
  if (!rawAnswer || typeof rawAnswer !== 'object') {
    throw new AIClientError('invalid_response', 'Learning answer schema invalid');
  }

  const record = rawAnswer as Record<string, unknown>;

  return {
    title: sanitizeText(record.title, fallback.title),
    summary: sanitizeText(record.summary, fallback.summary),
    keyConcepts: sanitizeStringArray(record.keyConcepts, fallback.keyConcepts),
    lessonSteps: sanitizeLessonSteps(record.lessonSteps, fallback.lessonSteps),
    examples: sanitizeExamples(record.examples, fallback.examples),
    practice: sanitizePractice(record.practice, fallback.practice),
    commonMistakes: sanitizeStringArray(record.commonMistakes, fallback.commonMistakes),
    checkpoint: sanitizeStringArray(record.checkpoint, fallback.checkpoint),
    quiz: sanitizeQuiz(record.quiz, fallback.quiz),
    resourceSummary: sanitizeText(record.resourceSummary, fallback.resourceSummary),
    references: filterReferences(record.references, resources),
  };
}

export async function generateLearningAnswer(input: GenerateLearningAnswerInput): Promise<LearningAnswer> {
  const safeInput = {
    ...input,
    goal: input.goal.trim() || '学习',
    phaseName: input.phaseName.trim() || '当前阶段',
    topic: input.topic.trim() || input.goal.trim() || '学习主题',
    mode: input.mode === 'lite' ? 'lite' as const : 'deep' as const,
    resources: input.resources.slice(0, 8),
  };
  const fallback = getMockLearningAnswer(safeInput);
  const resourceBriefs = normalizeResources(safeInput.resources);

  try {
    const content = await createChatCompletion({
      purpose: 'ask',
      messages: createLearningPromptMessages(safeInput, resourceBriefs),
      temperature: safeInput.mode === 'lite' ? 0.25 : 0.3,
      maxTokens: safeInput.mode === 'lite' ? 1800 : 3200,
      responseFormat: 'json_object',
      timeoutMs: getLearningTimeoutMs(),
    });

    return adaptLearningAnswer(parseAIJson<unknown>(content), fallback, safeInput.resources);
  } catch (error) {
    const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI learning fallback', {
      errorType: safeError.type,
      status: safeError.status,
      mode: safeInput.mode,
      topicLength: safeInput.topic.length,
      resourceCount: safeInput.resources.length,
    });

    return getMockLearningAnswer({
      ...safeInput,
      notice: safeInput.resources.length
        ? 'AILINES AI 深度整合暂时未完成，已先展示基础课程和参考资料。'
        : 'AILINES AI 深度整合暂时未完成，已先展示基础课程。',
    });
  }
}

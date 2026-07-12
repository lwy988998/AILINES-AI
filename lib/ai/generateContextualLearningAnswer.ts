import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { PlanMode } from '@/lib/ai/types';
import type { SearchResource } from '@/lib/search/resourceTypes';

const DEFAULT_CONTEXTUAL_CHAT_TIMEOUT_MS = 25_000;

type PageType = 'plan' | 'phase' | 'progress' | 'learn' | 'home' | 'unknown';

type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ContextualLearningReference = {
  title: string;
  source: string;
  url: string;
};

export type ContextualLearningAnswer = {
  answer: string;
  references: ContextualLearningReference[];
  fallbackUsed: boolean;
};

export type GenerateContextualLearningAnswerInput = {
  question: string;
  pageType: PageType;
  goal?: string;
  mode?: PlanMode;
  phaseName?: string;
  topic?: string;
  contextTitle?: string;
  contextSummary?: string;
  resources?: SearchResource[];
  messages?: ChatHistoryMessage[];
};

type ResourceBrief = {
  title: string;
  source: string;
  url: string;
  description: string;
  reason: string;
  type: string;
};

function getContextualChatTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_CONTEXTUAL_CHAT_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : getAIRequestTimeoutMs(DEFAULT_CONTEXTUAL_CHAT_TIMEOUT_MS);
}

function sanitizeText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function normalizeResources(resources: SearchResource[] = []): ResourceBrief[] {
  return resources.slice(0, 5).map((resource) => ({
    title: truncateText(resource.title, 120),
    source: truncateText(resource.source, 80),
    url: resource.url,
    description: truncateText(resource.description || resource.reason || '', 500),
    reason: truncateText(resource.reason || '', 300),
    type: resource.type,
  }));
}

function referencesFromResources(resources: SearchResource[] = []): ContextualLearningReference[] {
  return resources.slice(0, 3).map((resource) => ({
    title: resource.title,
    source: resource.source,
    url: resource.url,
  }));
}

function filterReferences(value: unknown, resources: SearchResource[] = []): ContextualLearningReference[] {
  const allowedByUrl = new Map(resources.map((resource) => [resource.url, resource]));
  if (!Array.isArray(value)) return referencesFromResources(resources);

  const references = value.map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const url = sanitizeText(record.url);
    const resource = allowedByUrl.get(url);
    if (!resource) return null;

    return {
      title: sanitizeText(record.title, resource.title),
      source: sanitizeText(record.source, resource.source),
      url: resource.url,
    };
  }).filter((item): item is ContextualLearningReference => Boolean(item));

  return references.length ? references.slice(0, 3) : referencesFromResources(resources);
}

function normalizeMessages(messages: ChatHistoryMessage[] = []) {
  return messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && message.content.trim())
    .slice(-6)
    .map((message) => ({ role: message.role, content: truncateText(message.content.trim(), 800) }));
}

function createFallbackAnswer(input: Required<Pick<GenerateContextualLearningAnswerInput, 'question' | 'pageType'>> & GenerateContextualLearningAnswerInput, resources: SearchResource[]): ContextualLearningAnswer {
  const mode = input.mode === 'lite' ? 'lite' : 'deep';
  const contextTitle = sanitizeText(input.contextTitle, sanitizeText(input.topic, sanitizeText(input.phaseName, sanitizeText(input.goal, '当前课程'))));
  const contextSummary = truncateText(sanitizeText(input.contextSummary, '当前页面没有提供更详细摘要。你可以先围绕页面标题、阶段目标和当前任务来判断下一步。'), 800);
  const goal = sanitizeText(input.goal, '当前学习目标');
  const phaseOrTopic = sanitizeText(input.topic, sanitizeText(input.phaseName, contextTitle));
  const references = referencesFromResources(resources);
  const resourceHint = references.length
    ? `\n\n参考资料入口：我找到了一些可继续查看的资料，例如「${references.map((item) => item.title).join('」「')}」。这些资料只作为延伸阅读，当前回答先以页面上下文为主。`
    : '';
  const deepExtra = mode === 'deep'
    ? `\n\n举个做法：先用一句话写下「${phaseOrTopic}」要解决的问题，再列出 3 个必须验证的点，最后做一个最小成果，比如一份功能清单、一个小 demo、一道练习或一段可运行代码。`
    : '';

  return {
    answer: `我先基于当前课程上下文给你一个基础解释：\n\n直接回答：围绕「${goal}」，你现在问的「${input.question}」应优先放回当前页面「${contextTitle}」来理解，不要跳出当前学习阶段泛泛查资料。\n\n分步解释：\n1. 先确认当前页面目标：${contextSummary}\n2. 再把问题拆成“我需要理解什么 / 我需要产出什么 / 我如何检查完成”。\n3. 如果你卡在概念上，先用自己的话复述；如果卡在操作或报错上，先记录输入、步骤、输出和错误信息。\n4. 下一步建议：先完成当前阶段最小任务，再把不确定的问题继续追问我，我会按当前课程语境帮你拆解。${deepExtra}${resourceHint}`,
    references,
    fallbackUsed: true,
  };
}

function createPromptMessages(input: GenerateContextualLearningAnswerInput, resourceBriefs: ResourceBrief[]) {
  const mode = input.mode === 'lite' ? 'lite' : 'deep';
  const answerLength = mode === 'lite' ? '控制在 300-600 字，短而清楚' : '控制在 700-1200 字，包含例子和练习建议';

  return [
    {
      role: 'system' as const,
      content: `你是 AILINES AI 学习助手。你正在课程页面中回答用户问题，必须结合页面上下文，不要脱离当前学习场景。学习相关问题要像老师一样分步解释；题目、操作或报错问题要给排查步骤。如果使用搜索资料，必须先整合资料，再用自己的话教学，不要直接粘贴搜索结果或把搜索结果列表当主体。不要编造链接；references 只能来自输入 resources.url。不要暴露内部 provider、API Key、环境变量或错误细节。只输出 JSON。`,
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        task: '基于当前页面上下文和可用资料，回答用户问题。',
        outputSchema: {
          answer: 'string',
          references: [{ title: 'string', source: 'string', url: 'string' }],
        },
        requirements: [
          '必须结合 goal、pageType、phaseName、topic、contextTitle、contextSummary。',
          '如果用户说“这个”，优先理解为当前 contextTitle/contextSummary 指向的内容。',
          '回答结构建议：直接回答、分步解释、举例、你现在可以怎么做、参考资料入口（可选）。',
          '参考资料只能作为入口，不要作为主体。',
          `${mode} 模式：${answerLength}。`,
        ],
        pageContext: {
          pageType: input.pageType,
          goal: input.goal,
          mode,
          phaseName: input.phaseName,
          topic: input.topic,
          contextTitle: input.contextTitle,
          contextSummary: input.contextSummary,
        },
        recentMessages: normalizeMessages(input.messages),
        question: input.question,
        resources: resourceBriefs,
      }),
    },
  ];
}

function adaptAnswer(rawAnswer: unknown, input: GenerateContextualLearningAnswerInput, resources: SearchResource[]): ContextualLearningAnswer {
  if (!rawAnswer || typeof rawAnswer !== 'object') {
    throw new AIClientError('invalid_response', 'Contextual learning answer schema invalid');
  }

  const record = rawAnswer as Record<string, unknown>;
  const answer = sanitizeText(record.answer);
  if (!answer) {
    throw new AIClientError('invalid_response', 'Contextual learning answer missing answer');
  }

  return {
    answer,
    references: filterReferences(record.references, resources),
    fallbackUsed: false,
  };
}

export async function generateContextualLearningAnswer(input: GenerateContextualLearningAnswerInput): Promise<ContextualLearningAnswer> {
  const safeInput: GenerateContextualLearningAnswerInput = {
    ...input,
    question: sanitizeText(input.question),
    pageType: input.pageType || 'unknown',
    mode: input.mode === 'lite' ? 'lite' : 'deep',
    goal: truncateText(sanitizeText(input.goal, '学习'), 300),
    phaseName: truncateText(sanitizeText(input.phaseName), 300),
    topic: truncateText(sanitizeText(input.topic), 300),
    contextTitle: truncateText(sanitizeText(input.contextTitle), 300),
    contextSummary: truncateText(sanitizeText(input.contextSummary), 1200),
    resources: (input.resources || []).slice(0, 5),
    messages: normalizeMessages(input.messages),
  };

  const resources = safeInput.resources || [];

  if (!safeInput.question) {
    return {
      answer: '请先输入你想问的问题，我会结合当前课程页面帮你解释。',
      references: [],
      fallbackUsed: true,
    };
  }

  try {
    const content = await createChatCompletion({
      purpose: 'ask',
      messages: createPromptMessages(safeInput, normalizeResources(resources)),
      temperature: safeInput.mode === 'lite' ? 0.25 : 0.3,
      maxTokens: safeInput.mode === 'lite' ? 1100 : 1800,
      responseFormat: 'json_object',
      timeoutMs: getContextualChatTimeoutMs(),
    });

    return adaptAnswer(parseAIJson<unknown>(content), safeInput, resources);
  } catch (error) {
    const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
    console.warn('AI contextual learning fallback', {
      errorType: safeError.type,
      status: safeError.status,
      mode: safeInput.mode,
      pageType: safeInput.pageType,
      resourceCount: resources.length,
    });

    return createFallbackAnswer(safeInput as Required<Pick<GenerateContextualLearningAnswerInput, 'question' | 'pageType'>> & GenerateContextualLearningAnswerInput, resources);
  }
}

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

function createUnavailableAnswer(resources: SearchResource[] = []): ContextualLearningAnswer {
  return {
    answer: '回答暂未生成完成。你可以稍后重试，或把问题补充得更具体后再次发送。',
    references: referencesFromResources(resources),
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
      answer: '请先输入你想问的问题。',
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

    return createUnavailableAnswer(resources);
  }
}

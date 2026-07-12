import { NextResponse } from 'next/server';
import { generateContextualLearningAnswer } from '@/lib/ai/generateContextualLearningAnswer';
import type { PlanMode } from '@/lib/ai/types';
import { searchResources } from '@/lib/search/searchResources';
import type { SearchResource } from '@/lib/search/resourceTypes';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 8_000;
const VALID_PAGE_TYPES = new Set(['plan', 'phase', 'progress', 'learn', 'home', 'unknown']);

type ChatBody = {
  question?: unknown;
  pageType?: unknown;
  goal?: unknown;
  mode?: unknown;
  phaseName?: unknown;
  topic?: unknown;
  contextTitle?: unknown;
  contextSummary?: unknown;
  messages?: unknown;
};

function sanitizeText(value: unknown, maxLength = 1000) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeMode(value: unknown): PlanMode {
  return value === 'lite' ? 'lite' : 'deep';
}

function normalizePageType(value: unknown) {
  const pageType = sanitizeText(value, 40);
  return VALID_PAGE_TYPES.has(pageType) ? pageType as 'plan' | 'phase' | 'progress' | 'learn' | 'home' | 'unknown' : 'unknown';
}

function normalizeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const role = record.role === 'user' ? 'user' : record.role === 'assistant' ? 'assistant' : null;
    const content = sanitizeText(record.content, 1000);
    return role && content ? { role, content } : null;
  }).filter((item): item is { role: 'user' | 'assistant'; content: string } => Boolean(item));
}

function buildSearchQuery(body: {
  goal: string;
  phaseName: string;
  topic: string;
  question: string;
  contextTitle: string;
}) {
  return [body.goal, body.phaseName, body.topic, body.contextTitle, body.question, '学习资料 教程 例子 练习']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

async function searchResourcesSafely(query: string): Promise<SearchResource[]> {
  if (!query.trim()) return [];

  try {
    const result = await Promise.race([
      searchResources(query),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('resource search timeout')), RESOURCE_SEARCH_TIMEOUT_MS)),
    ]);

    return result.resources.slice(0, 5);
  } catch (error) {
    console.warn('Learning chat resource search fallback', error instanceof Error ? error.message : 'unknown error');
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({})) as ChatBody;
    const question = sanitizeText(rawBody.question, 1200);

    if (!question) {
      return NextResponse.json({ answer: '请先输入你想问的问题。', references: [], fallbackUsed: true }, { status: 400 });
    }

    const context = {
      question,
      pageType: normalizePageType(rawBody.pageType),
      goal: sanitizeText(rawBody.goal, 300),
      mode: normalizeMode(rawBody.mode),
      phaseName: sanitizeText(rawBody.phaseName, 300),
      topic: sanitizeText(rawBody.topic, 300),
      contextTitle: sanitizeText(rawBody.contextTitle, 300),
      contextSummary: sanitizeText(rawBody.contextSummary, 1200),
      messages: normalizeMessages(rawBody.messages),
    };

    const resources = await searchResourcesSafely(buildSearchQuery(context));
    const answer = await generateContextualLearningAnswer({ ...context, resources });

    return NextResponse.json(answer);
  } catch (error) {
    console.warn('Learning chat fallback response', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({
      answer: '当前连接不稳定，我先根据页面上下文给你基础回答：请先回到当前课程目标，确认这一页要求你理解的核心概念、要完成的任务和检查标准。你可以把问题再具体一点，我会继续按当前学习场景帮你拆解。',
      references: [],
      fallbackUsed: true,
    });
  }
}

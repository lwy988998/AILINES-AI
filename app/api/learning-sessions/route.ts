import { NextRequest, NextResponse } from 'next/server';
import { getLearningSession, upsertLearningSession } from '@/lib/course/learningSessionRepository';

function parsePositiveInt(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseBodyPositiveInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sessionPayload(session: Awaited<ReturnType<typeof getLearningSession>>) {
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    summary: session.summary,
    searchQuery: session.searchQuery,
    content: session.content,
    references: session.references,
    fallbackUsed: session.fallbackUsed,
    source: session.source,
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const goal = request.nextUrl.searchParams.get('goal')?.trim() || '';
  const phaseIndex = parsePositiveInt(request.nextUrl.searchParams.get('phaseIndex'));
  const topicIndex = parsePositiveInt(request.nextUrl.searchParams.get('topicIndex'));
  const phaseName = request.nextUrl.searchParams.get('phaseName')?.trim() || '';
  const topicTitle = request.nextUrl.searchParams.get('topicTitle')?.trim() || '';

  if (!goal || !phaseIndex || !topicIndex || !phaseName || !topicTitle) {
    return NextResponse.json({ error: '学习内容参数不完整' }, { status: 400 });
  }

  try {
    const session = await getLearningSession({
      courseId: request.nextUrl.searchParams.get('courseId') || undefined,
      anonymousId: request.nextUrl.searchParams.get('anonymousId') || undefined,
      goal,
      mode: request.nextUrl.searchParams.get('mode') || undefined,
      phaseIndex,
      phaseName,
      topicIndex,
      topicTitle,
    });

    const payload = sessionPayload(session);
    return payload ? NextResponse.json({ found: true, session: payload }) : NextResponse.json({ found: false });
  } catch {
    return NextResponse.json({ found: false, error: '学习内容加载失败，请稍后重试' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const goal = optionalString(data.goal) || '';
  const phaseIndex = parseBodyPositiveInt(data.phaseIndex);
  const topicIndex = parseBodyPositiveInt(data.topicIndex);
  const phaseName = optionalString(data.phaseName) || '';
  const topicTitle = optionalString(data.topicTitle) || '';
  const title = optionalString(data.title) || '';

  if (!goal || !phaseIndex || !topicIndex || !phaseName || !topicTitle || !title || data.content === undefined || data.content === null) {
    return NextResponse.json({ error: '学习内容参数不完整' }, { status: 400 });
  }

  try {
    const session = await upsertLearningSession({
      courseId: optionalString(data.courseId),
      anonymousId: optionalString(data.anonymousId),
      goal,
      mode: optionalString(data.mode),
      phaseIndex,
      phaseName,
      topicIndex,
      topicTitle,
      title,
      summary: optionalString(data.summary),
      searchQuery: optionalString(data.searchQuery),
      content: data.content,
      references: data.references,
      fallbackUsed: Boolean(data.fallbackUsed),
      source: optionalString(data.source),
    });

    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch {
    return NextResponse.json({ error: '学习内容保存失败，请稍后重试' }, { status: 500 });
  }
}

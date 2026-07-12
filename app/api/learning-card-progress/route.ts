import { NextRequest, NextResponse } from 'next/server';
import { listLearningCardProgress, normalizeLearningCardStatus, upsertLearningCardProgress } from '@/lib/course/learningCardProgressRepository';

function parsePositiveInt(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest) {
  const goal = request.nextUrl.searchParams.get('goal')?.trim() || '';
  if (!goal) return NextResponse.json({ error: '学习卡片进度参数不完整' }, { status: 400 });

  try {
    const items = await listLearningCardProgress({
      courseId: request.nextUrl.searchParams.get('courseId') || undefined,
      anonymousId: request.nextUrl.searchParams.get('anonymousId') || undefined,
      goal,
      mode: request.nextUrl.searchParams.get('mode') || undefined,
      phaseIndex: parsePositiveInt(request.nextUrl.searchParams.get('phaseIndex')),
      phaseName: request.nextUrl.searchParams.get('phaseName') || undefined,
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: '学习卡片进度暂时不可用' }, { status: 200 });
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
  const phaseIndex = parseNonNegativeInt(data.phaseIndex);
  const topicIndex = parseNonNegativeInt(data.topicIndex);
  const topicTitle = optionalString(data.topicTitle) || '';

  if (!goal || phaseIndex === null || phaseIndex < 1 || topicIndex === null || !topicTitle) {
    return NextResponse.json({ error: '学习卡片进度参数不完整' }, { status: 400 });
  }

  try {
    const item = await upsertLearningCardProgress({
      courseId: optionalString(data.courseId),
      anonymousId: optionalString(data.anonymousId),
      goal,
      mode: optionalString(data.mode),
      phaseIndex,
      phaseName: optionalString(data.phaseName) || `阶段${phaseIndex}`,
      topicIndex,
      topicTitle,
      status: normalizeLearningCardStatus(data.status),
    });
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: '学习卡片进度保存失败，请稍后重试' }, { status: 500 });
  }
}

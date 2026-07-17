import { NextRequest, NextResponse } from 'next/server';
import { recomputeCourseProgress } from '@/lib/course/courseProgressRepository';
import { listTaskProgress, normalizeTaskProgressStatus, upsertTaskProgress } from '@/lib/course/taskProgressRepository';

function parsePositiveInt(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest) {
  const phaseIndex = parsePositiveInt(request.nextUrl.searchParams.get('phaseIndex'));
  const goal = request.nextUrl.searchParams.get('goal')?.trim() || '';

  if (!goal || !phaseIndex) {
    return NextResponse.json({ error: '任务进度参数不完整。' }, { status: 400 });
  }

  try {
    const items = await listTaskProgress({
      courseId: request.nextUrl.searchParams.get('courseId') || undefined,
      anonymousId: request.nextUrl.searchParams.get('anonymousId') || undefined,
      goal,
      mode: request.nextUrl.searchParams.get('mode') || undefined,
      phaseIndex,
      phaseName: request.nextUrl.searchParams.get('phaseName') || `阶段${phaseIndex}`,
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: '任务进度加载失败，请稍后重试。' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求内容格式不正确。' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const goal = optionalString(data.goal) || '';
  const phaseIndex = parseNonNegativeInt(data.phaseIndex);
  const taskIndex = parseNonNegativeInt(data.taskIndex);
  const taskTitle = optionalString(data.taskTitle) || '';

  if (!goal || phaseIndex === null || phaseIndex < 1 || taskIndex === null || !taskTitle) {
    return NextResponse.json({ error: '任务进度参数不完整。' }, { status: 400 });
  }

  try {
    const courseId = optionalString(data.courseId);
    const anonymousId = optionalString(data.anonymousId);
    const item = await upsertTaskProgress({
      courseId,
      anonymousId,
      goal,
      mode: optionalString(data.mode),
      phaseIndex,
      phaseName: optionalString(data.phaseName) || `阶段${phaseIndex}`,
      taskIndex,
      taskTitle,
      status: normalizeTaskProgressStatus(data.status),
    });

    if (courseId) {
      recomputeCourseProgress({ courseId, anonymousId }).catch((error) => {
        console.warn('course progress recompute after task progress failed', error instanceof Error ? error.message : 'unknown');
      });
    }

    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: '任务进度保存失败，请稍后重试。' }, { status: 500 });
  }
}

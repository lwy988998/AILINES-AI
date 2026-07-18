'use client';

import { useEffect, useRef, useState } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { saveCourseSnapshot } from '@/lib/courseHistory';
import type { MockPlan } from '@/lib/mockPlan';

const COURSE_SAVE_REQUEST_TIMEOUT_MS = 12_000;

type CourseHistoryRecorderProps = {
  goal: string;
  mode: string;
  title?: string;
  summary?: string;
  source?: string;
  plan: MockPlan;
};

export function CourseHistoryRecorder({ goal, mode, title, summary, source = 'ai', plan }: CourseHistoryRecorderProps) {
  const savedKeyRef = useRef('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const saveKey = `${goal}|${mode}|${title || plan.title}`;
    if (savedKeyRef.current === saveKey) return;
    savedKeyRef.current = saveKey;

    let cancelled = false;

    async function saveSnapshot() {
      const localTitle = title || plan.title || goal;
      const anonymousId = getOrCreateAnonymousId();

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), COURSE_SAVE_REQUEST_TIMEOUT_MS);

      try {
        setSaveError('');
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anonymousId,
            goal,
            mode,
            title: localTitle,
            summary: summary || plan.summary,
            source,
            payload: plan,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('course save failed');
        const result = await response.json() as { courseId?: string };
        if (!cancelled && result.courseId) {
          saveCourseSnapshot({ id: result.courseId, goal, mode, title: localTitle, plan });
          window.dispatchEvent(new Event('ailines-course-history-updated'));
        }
      } catch (error) {
        console.warn('Course database save failed; local history fallback kept.', error instanceof Error ? error.message : 'unknown');
        if (!cancelled) {
          setSaveError('课程快照保存失败。当前页面内容仍可查看，你可以稍后重新生成或返回首页。');
          saveCourseSnapshot({ goal, mode, title: localTitle, plan });
          window.dispatchEvent(new Event('ailines-course-history-updated'));
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    saveSnapshot();

    return () => {
      cancelled = true;
    };
  }, [goal, mode, title, summary, source, plan]);

  if (!saveError) return null;

  return (
    <div className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8" role="status" aria-live="polite">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {saveError}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { saveCourseSnapshot } from '@/lib/courseHistory';
import type { MockPlan } from '@/lib/mockPlan';

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

  useEffect(() => {
    const saveKey = `${goal}|${mode}|${title || plan.title}`;
    if (savedKeyRef.current === saveKey) return;
    savedKeyRef.current = saveKey;

    let cancelled = false;

    async function saveSnapshot() {
      const localTitle = title || plan.title || goal;
      const anonymousId = getOrCreateAnonymousId();

      try {
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
          saveCourseSnapshot({ goal, mode, title: localTitle, plan });
          window.dispatchEvent(new Event('ailines-course-history-updated'));
        }
      }
    }

    saveSnapshot();

    return () => {
      cancelled = true;
    };
  }, [goal, mode, title, summary, source, plan]);

  return null;
}

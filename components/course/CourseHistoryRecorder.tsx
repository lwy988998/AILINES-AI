'use client';

import { useEffect } from 'react';
import { saveCourseSnapshot } from '@/lib/courseHistory';
import type { MockPlan } from '@/lib/mockPlan';

type CourseHistoryRecorderProps = {
  goal: string;
  mode: string;
  title?: string;
  plan: MockPlan;
};

export function CourseHistoryRecorder({ goal, mode, title, plan }: CourseHistoryRecorderProps) {
  useEffect(() => {
    saveCourseSnapshot({ goal, mode, title, plan });
  }, [goal, mode, title, plan]);

  return null;
}

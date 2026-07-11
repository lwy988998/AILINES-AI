'use client';

import { useEffect } from 'react';
import { saveCourseHistoryItem } from '@/lib/courseHistory';

type CourseHistoryRecorderProps = {
  goal: string;
  mode: string;
  title?: string;
};

export function CourseHistoryRecorder({ goal, mode, title }: CourseHistoryRecorderProps) {
  useEffect(() => {
    saveCourseHistoryItem({ goal, mode, title });
  }, [goal, mode, title]);

  return null;
}

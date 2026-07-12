'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';

type LastVisitedRecorderProps = {
  courseId?: string;
  anonymousId?: string;
  goal: string;
  mode?: string;
  lastVisitedUrl?: string;
  lastPageType: string;
  lastPhaseIndex?: number;
  lastPhaseName?: string;
  lastTopicIndex?: number;
  lastTopicTitle?: string;
};

export function LastVisitedRecorder({
  courseId,
  anonymousId,
  goal,
  mode,
  lastVisitedUrl,
  lastPageType,
  lastPhaseIndex,
  lastPhaseName,
  lastTopicIndex,
  lastTopicTitle,
}: LastVisitedRecorderProps) {
  const sentKeyRef = useRef('');

  useEffect(() => {
    if (!courseId) return;
    const url = lastVisitedUrl || `${window.location.pathname}${window.location.search}`;
    const key = JSON.stringify({ courseId, url, lastPageType, lastPhaseIndex, lastPhaseName, lastTopicIndex, lastTopicTitle });
    if (sentKeyRef.current === key) return;
    sentKeyRef.current = key;

    const resolvedAnonymousId = anonymousId || getOrCreateAnonymousId();
    fetch('/api/course-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'lastVisited',
        courseId,
        anonymousId: resolvedAnonymousId,
        goal,
        mode,
        lastVisitedUrl: url,
        lastPageType,
        lastPhaseIndex,
        lastPhaseName,
        lastTopicIndex,
        lastTopicTitle,
      }),
    }).catch((error) => {
      console.warn('Course last visited save failed; page continues normally.', error instanceof Error ? error.message : 'unknown');
    });
  }, [courseId, anonymousId, goal, mode, lastVisitedUrl, lastPageType, lastPhaseIndex, lastPhaseName, lastTopicIndex, lastTopicTitle]);

  return null;
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { getProgressStorageKey } from '@/lib/progressStorage';
import type { LearningCardProgressItem, LearningCardStatus } from '@/lib/course/learningCardProgressRepository';

type LearnCompletionButtonProps = {
  goal: string;
  mode: 'lite' | 'deep';
  courseId?: string;
  taskId?: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topic: string;
  progressHref?: string;
};

function getTopicStorageKey(goal: string, phaseName: string, topic: string) {
  return `ailines-progress-topic:${goal}:${phaseName}:${topic}`;
}

function readCompletedIds(goal: string) {
  try {
    const rawValue = window.localStorage.getItem(getProgressStorageKey(goal));
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeCompletedId(goal: string, taskId?: string) {
  if (!taskId) return;
  const storageKey = getProgressStorageKey(goal);
  const ids = readCompletedIds(goal);
  const nextIds = ids.includes(taskId) ? ids : [...ids, taskId];
  window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
}

export function LearnCompletionButton({ goal, mode, courseId, taskId, phaseIndex, phaseName, topicIndex, topic, progressHref }: LearnCompletionButtonProps) {
  const [status, setStatus] = useState<LearningCardStatus>('not_started');
  const [syncLabel, setSyncLabel] = useState('学习状态会自动保存');
  const latestSaveRef = useRef(0);
  const completed = status === 'completed';

  function writeLocal(nextStatus: LearningCardStatus) {
    const topicKey = getTopicStorageKey(goal, phaseName, topic);
    if (nextStatus === 'not_started') window.localStorage.removeItem(topicKey);
    else window.localStorage.setItem(topicKey, nextStatus);
    if (nextStatus === 'completed') writeCompletedId(goal, taskId);
  }

  useEffect(() => {
    let localStatus: LearningCardStatus = 'not_started';
    try {
      const topicKey = getTopicStorageKey(goal, phaseName, topic);
      const topicState = window.localStorage.getItem(topicKey);
      const ids = readCompletedIds(goal);
      if (topicState === 'completed' || Boolean(taskId && ids.includes(taskId))) localStatus = 'completed';
      else if (topicState === 'in_progress') localStatus = 'in_progress';
      else {
        localStatus = 'in_progress';
        window.localStorage.setItem(topicKey, 'in_progress');
      }
      setStatus(localStatus);
      setSyncLabel('正在同步学习状态…');
    } catch {
      setStatus('in_progress');
    }

    let cancelled = false;
    async function loadDb() {
      const anonymousId = getOrCreateAnonymousId();
      const params = new URLSearchParams({ anonymousId, goal, mode, phaseIndex: String(phaseIndex), phaseName });
      if (courseId) params.set('courseId', courseId);
      try {
        const response = await fetch(`/api/learning-card-progress?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('learning card progress api failed');
        const data = await response.json() as { items?: LearningCardProgressItem[] };
        const item = Array.isArray(data.items) ? data.items.find((entry) => entry.topicIndex === topicIndex) : undefined;
        if (cancelled) return;
        if (item) {
          setStatus(item.status);
          writeLocal(item.status);
          setSyncLabel('已恢复学习状态');
        } else {
          setSyncLabel(localStatus !== 'not_started' ? '已恢复本地学习状态' : '学习状态会自动保存');
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Learning card progress database load failed; using localStorage fallback.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('已保留本地学习状态');
        }
      }
    }
    loadDb();
    return () => { cancelled = true; };
  }, [goal, mode, courseId, taskId, phaseIndex, phaseName, topicIndex, topic]);

  function saveToDatabase(nextStatus: LearningCardStatus) {
    const version = Date.now();
    latestSaveRef.current = version;
    const anonymousId = getOrCreateAnonymousId();
    fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: courseId || undefined,
        anonymousId,
        goal,
        mode,
        phaseIndex,
        phaseName,
        topicIndex,
        topicTitle: topic,
        status: nextStatus,
        lastVisitedUrl: `${window.location.pathname}${window.location.search}`,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('learning card progress save failed');
        if (latestSaveRef.current === version) setSyncLabel(courseId ? '已同步到课程进度' : '已保存学习状态');
      })
      .catch((error) => {
        if (latestSaveRef.current === version) {
          console.warn('Learning card progress database save failed; localStorage fallback kept.', error instanceof Error ? error.message : 'unknown');
          setSyncLabel('已保留本地学习状态');
        }
      });
  }

  function markCompleted() {
    setStatus('completed');
    setSyncLabel('正在保存学习状态…');
    try {
      writeLocal('completed');
    } catch {
      // localStorage fallback failed; keep optimistic UI.
    }
    saveToDatabase('completed');
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={markCompleted}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 ${
          completed
            ? 'bg-emerald-50 text-emerald-700 focus:ring-emerald-100'
            : 'bg-sky-700 text-white hover:bg-sky-800 focus:ring-sky-200'
        }`}
      >
        <CheckCircle2 className="h-4 w-4" />
        {completed ? '已学完这一项' : '我已学完这一项'}
      </button>
      <p className="text-xs font-medium text-sky-700">{syncLabel}</p>
      {progressHref ? (
        <Link href={progressHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 transition hover:text-sky-900">
          <ListChecks className="h-3.5 w-3.5" />
          返回进度页
        </Link>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getProgressStorageKey } from '@/lib/progressStorage';

type LearnCompletionButtonProps = {
  goal: string;
  taskId?: string;
  phaseName: string;
  topic: string;
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

export function LearnCompletionButton({ goal, taskId, phaseName, topic }: LearnCompletionButtonProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    try {
      const topicKey = getTopicStorageKey(goal, phaseName, topic);
      const topicState = window.localStorage.getItem(topicKey);
      const ids = readCompletedIds(goal);
      const isCompleted = topicState === 'completed' || Boolean(taskId && ids.includes(taskId));

      if (!isCompleted && topicState !== 'in_progress') {
        window.localStorage.setItem(topicKey, 'in_progress');
      }

      setCompleted(isCompleted);
    } catch {
      setCompleted(false);
    }
  }, [goal, taskId, phaseName, topic]);

  function markCompleted() {
    try {
      window.localStorage.setItem(getTopicStorageKey(goal, phaseName, topic), 'completed');

      if (taskId) {
        const storageKey = getProgressStorageKey(goal);
        const ids = readCompletedIds(goal);
        const nextIds = ids.includes(taskId) ? ids : [...ids, taskId];
        window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
      }

      setCompleted(true);
    } catch {
      setCompleted(true);
    }
  }

  return (
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
  );
}

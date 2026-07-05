'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProgressHeader } from '@/components/ProgressHeader';
import { ProgressOverview } from '@/components/ProgressOverview';
import { ProgressStageCard } from '@/components/ProgressStageCard';
import { progressStages } from '@/lib/mockProgress';
import { clearProgressState, loadProgressState, saveProgressState } from '@/lib/progressStorage';

type ProgressTrackerProps = {
  goal: string;
  title: string;
};

export function ProgressTracker({ goal, title }: ProgressTrackerProps) {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const allTaskIds = useMemo(() => progressStages.flatMap((stage) => stage.tasks.map((task) => task.id)), []);
  const totalCount = allTaskIds.length;
  const completedCount = completedTaskIds.filter((taskId) => allTaskIds.includes(taskId)).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  useEffect(() => {
    setCompletedTaskIds(loadProgressState(goal));
    setIsLoaded(true);
  }, [goal]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveProgressState(goal, completedTaskIds);
  }, [completedTaskIds, goal, isLoaded]);

  function toggleTask(taskId: string) {
    setCompletedTaskIds((currentTaskIds) =>
      currentTaskIds.includes(taskId)
        ? currentTaskIds.filter((currentTaskId) => currentTaskId !== taskId)
        : [...currentTaskIds, taskId],
    );
  }

  function resetProgress() {
    if (!confirm('确定要重置当前学习进度吗？')) {
      return;
    }

    clearProgressState(goal);
    setCompletedTaskIds([]);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ProgressHeader
        goal={goal}
        title={title}
        onAskAi={() => alert('轻量问答功能将在后续任务中开放')}
      />
      <ProgressOverview
        completedCount={completedCount}
        totalCount={totalCount}
        percent={percent}
        onReset={resetProgress}
      />
      <section className="grid gap-6 lg:grid-cols-2">
        {progressStages.map((stage) => (
          <ProgressStageCard
            key={stage.id}
            stage={stage}
            completedTaskIds={completedTaskIds}
            onToggleTask={toggleTask}
          />
        ))}
      </section>
    </div>
  );
}

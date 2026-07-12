import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { ProgressTracker } from '@/components/ProgressTracker';
import { SiteHeader } from '@/components/site-header';
import { getCourseProgress, recomputeCourseProgress } from '@/lib/course/courseProgressRepository';
import { getProgressStagesByGoal } from '@/lib/mockProgress';

type ProgressPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    courseId?: string;
  }>;
};

function normalizeMode(value?: string): 'lite' | 'deep' {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const goal = params.goal?.trim() || '我的';
  const mode = normalizeMode(params.mode);
  const courseId = params.courseId?.trim() || '';
  const title = params.goal?.trim() ? `${goal} 学习进度` : '我的学习进度';
  const progressStages = getProgressStagesByGoal(goal);
  let courseProgress = courseId ? await getCourseProgress(courseId) : null;
  if (courseId && !courseProgress) {
    courseProgress = await recomputeCourseProgress({ courseId });
  }
  const contextSummary = progressStages
    .slice(0, 5)
    .map((stage, index) => `阶段 ${index + 1}：${stage.title}，包含任务：${stage.tasks.slice(0, 4).map((task) => task.title).join('、')}`)
    .join('\n')
    .slice(0, 1000);

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      {courseId ? <LastVisitedRecorder courseId={courseId} goal={goal} mode={mode} lastPageType="progress" /> : null}
      <SiteHeader />
      <ProgressTracker goal={goal} mode={mode} courseId={courseId} title={title} courseProgress={courseProgress} />
      <FloatingAilinesChat
        pageType="progress"
        goal={goal}
        mode={mode}
        contextTitle={title}
        contextSummary={contextSummary}
      />
    </main>
  );
}

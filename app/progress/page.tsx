import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { ProgressTracker } from '@/components/ProgressTracker';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { getCourseProgress, recomputeCourseProgress } from '@/lib/course/courseProgressRepository';
import { progressStagesFromCoursePlan } from '@/lib/mockProgress';
import type { MockPlan } from '@/lib/mockPlan';
import { buildUnavailableCourseContentNotice, normalizeCoursePlanContent, validateUserVisibleCourseContent } from '@/lib/courseContentQuality';
import { markCourseContentSource, type CourseContentSource } from '@/lib/courseContentSource';

type ProgressPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    courseId?: string;
    anonymousId?: string;
  }>;
};

function normalizeMode(value?: string): 'lite' | 'deep' {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function sourceForStoredCourse(source?: string | null): CourseContentSource {
  if (source === 'fallback' || source === 'domain-fallback') return 'domain-fallback';
  if (source === 'template' || source === 'mock') return 'template';
  if (source === 'invalid') return 'invalid';
  return 'legacy-ai';
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const courseId = params.courseId?.trim() || '';
  const anonymousId = params.anonymousId?.trim() || undefined;
  const user = await getCurrentUser();
  const ownedCourse = courseId ? await getCourseOwnedByRequester({ courseId, anonymousId, userId: user?.id }).catch(() => null) : null;

  if (courseId && !ownedCourse) {
    return (
      <main className="learn-app-page min-h-screen bg-[#f5f9ff]">
        <SiteHeader />
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
          <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">无法查看这个课程进度</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">这个课程不存在、已失效，或当前账号没有访问权限。</p>
          </section>
        </div>
      </main>
    );
  }

  const goal = ownedCourse?.goal || params.goal?.trim() || '我的';
  const mode = normalizeMode(ownedCourse?.mode || params.mode);
  const title = params.goal?.trim() || ownedCourse?.title ? `${goal} 学习进度` : '我的学习进度';
  const snapshotPayload = ownedCourse?.snapshots[0]?.payload as MockPlan | undefined;
  const snapshotPlan = snapshotPayload ? normalizeCoursePlanContent(markCourseContentSource(snapshotPayload, sourceForStoredCourse(ownedCourse?.source)), goal) : undefined;
  const snapshotValidation = snapshotPlan ? validateUserVisibleCourseContent(snapshotPlan, { goal, mode, courseTitle: snapshotPlan.title }) : null;
  const progressStages = snapshotPlan && snapshotValidation?.valid ? progressStagesFromCoursePlan(snapshotPlan, goal) : [];

  if (progressStages.length === 0) {
    return (
      <main className="learn-app-page min-h-screen bg-[#f5f9ff]">
        <SiteHeader />
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
          <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">学习进度暂未生成完成</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{buildUnavailableCourseContentNotice('这门课程的进度卡片')}</p>
          </section>
        </div>
      </main>
    );
  }

  let courseProgress = courseId ? await getCourseProgress(courseId) : null;
  if (courseId && !courseProgress) {
    courseProgress = await recomputeCourseProgress({ courseId, anonymousId: ownedCourse?.anonymousId || anonymousId });
  }
  const contextSummary = progressStages
    .slice(0, 5)
    .map((stage, index) => `阶段 ${index + 1}：${stage.title}，包含任务：${stage.tasks.slice(0, 4).map((task) => task.title).join('、')}`)
    .join('\n')
    .slice(0, 1000);

  return (
    <main className="learn-app-page min-h-screen bg-[#f5f9ff]">
      {courseId ? <LastVisitedRecorder courseId={courseId} goal={goal} mode={mode} lastPageType="progress" /> : null}
      <SiteHeader />
      <ProgressTracker goal={goal} mode={mode} courseId={courseId} anonymousId={ownedCourse?.anonymousId || anonymousId} title={title} courseProgress={courseProgress} initialStages={progressStages} />
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

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Home, RefreshCw } from 'lucide-react';
import { CoursePlanView } from '@/components/course/CoursePlanView';
import { LitePlanView } from '@/components/course/LitePlanView';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { getCourseProgress, recomputeCourseProgress } from '@/lib/course/courseProgressRepository';
import type { PlanMode } from '@/lib/ai/types';
import type { MockPlan } from '@/lib/mockPlan';
import { normalizeCoursePlanContent, validateUserVisibleCourseContent, buildUnavailableCourseContentNotice } from '@/lib/courseContentQuality';
import { markCourseContentSource, type CourseContentSource } from '@/lib/courseContentSource';

function getModeText(mode: PlanMode) {
  return mode === 'lite'
    ? { label: '快速规划', description: '已恢复保存过的快速规划课程。' }
    : { label: '深度 AILINES AI 规划', description: '已恢复保存过的系统学习课程。' };
}

function isPlanMode(value: string): value is PlanMode {
  return value === 'lite' || value === 'deep';
}

function isStoredPlan(value: unknown): value is MockPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<MockPlan>;
  return typeof plan.title === 'string' && Array.isArray(plan.roadmap) && Array.isArray(plan.courseStructure) && Array.isArray(plan.resources) && Array.isArray(plan.projects);
}

function sourceForStoredCourse(source?: string | null): CourseContentSource {
  if (source === 'fallback' || source === 'domain-fallback') return 'domain-fallback';
  if (source === 'template' || source === 'mock') return 'template';
  if (source === 'invalid') return 'invalid';
  return 'legacy-ai';
}

function MissingCourseState({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
      <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">历史课堂不存在或已失效</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{message || '没有找到这门历史课堂。你可以返回首页重新生成课程。'}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
            <Home className="h-4 w-4" />
            返回首页
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
            <RefreshCw className="h-4 w-4" />
            重新生成
          </Link>
        </div>
      </section>
    </div>
  );
}

export async function StoredCoursePlan({ courseId, anonymousId }: { courseId: string; anonymousId?: string }) {
  const user = await getCurrentUser();
  const ownedCourse = await getCourseOwnedByRequester({ courseId, userId: user?.id, anonymousId });
  const result = ownedCourse?.snapshots[0] ? { course: ownedCourse, snapshot: ownedCourse.snapshots[0] } : null;

  if (!result || !isPlanMode(result.course.mode) || !isStoredPlan(result.snapshot.payload)) {
    return <MissingCourseState />;
  }

  const modeText = getModeText(result.course.mode);
  const goal = result.course.goal || result.snapshot.payload.title;
  const plan = normalizeCoursePlanContent(markCourseContentSource(result.snapshot.payload, sourceForStoredCourse(result.course.source)), goal);
  const restoredValidation = validateUserVisibleCourseContent(plan, { goal, mode: result.course.mode, courseTitle: plan.title });
  if (!restoredValidation.valid) {
    return <MissingCourseState message={buildUnavailableCourseContentNotice('这门历史课程')} />;
  }
  let courseProgress = await getCourseProgress(result.course.id);
  if (!courseProgress) {
    courseProgress = await recomputeCourseProgress({ courseId: result.course.id, anonymousId: result.course.anonymousId || undefined });
  }

  const ownedAnonymousId = result.course.anonymousId || anonymousId;
  const anonymousQuery = ownedAnonymousId && !user ? `&anonymousId=${encodeURIComponent(ownedAnonymousId)}` : '';

  const notice = (
    <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm shadow-sky-900/5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" />已恢复历史课堂</p>
        <p className="mt-1 font-medium">已为你恢复保存过的课程内容。</p>
      </div>
      <Link href={`/progress?goal=${encodeURIComponent(goal)}&mode=${result.course.mode}&courseId=${encodeURIComponent(result.course.id)}${anonymousQuery}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
        进入进度追踪
      </Link>
    </section>
  );

  if (result.course.mode === 'lite') {
    return (
      <LitePlanView
        goal={goal}
        mode={result.course.mode}
        plan={plan}
        resourceSourceMessage="已恢复历史课堂中的学习资料。"
        courseId={result.course.id}
        anonymousId={ownedAnonymousId}
        courseProgress={courseProgress}
        notice={notice}
      />
    );
  }

  return (
    <CoursePlanView
      goal={goal}
      mode={result.course.mode}
      plan={plan}
      modeLabel={modeText.label}
      modeDescription={modeText.description}
      resourceSourceMessage="已恢复历史课堂中的学习资料。"
      courseId={result.course.id}
      anonymousId={ownedAnonymousId}
      courseProgress={courseProgress}
      notice={notice}
      membershipTier={user?.membershipTier || 'free'}
    />
  );
}

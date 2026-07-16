import Link from 'next/link';
import { ArrowLeft, AlertTriangle, BookOpen, CheckCircle2, Clock3, ExternalLink, GraduationCap, Home, Layers3, ListChecks, Sparkles } from 'lucide-react';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { LearnInteractiveLesson } from '@/components/LearnInteractiveLesson';
import { SiteHeader } from '@/components/site-header';
import { generateLearningAnswer } from '@/lib/ai/generateLearningAnswer';
import { getCurrentUser } from '@/lib/auth/currentUser';
import type { PlanMode } from '@/lib/ai/types';
import { getCourseOwnedByRequester } from '@/lib/course/courseRepository';
import { getLearningSession, upsertLearningSession } from '@/lib/course/learningSessionRepository';
import { getMockLearningAnswer, sanitizeLearningAnswer, type LearningAnswer } from '@/lib/learning/mockLearningAnswer';
import { getProgressStagesByGoal } from '@/lib/mockProgress';
import type { CourseStage, MockPlan } from '@/lib/mockPlan';
import { ResourceSearchError, searchResources } from '@/lib/search/searchResources';
import type { SearchResource } from '@/lib/search/resourceTypes';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';

export const dynamic = 'force-dynamic';

const RESOURCE_SEARCH_TIMEOUT_MS = 15_000;

type LearnPageProps = {
  searchParams: Promise<{
    goal?: string;
    mode?: string;
    phaseName?: string;
    topic?: string;
    phaseIndex?: string;
    topicIndex?: string;
    courseId?: string;
    regenerate?: string;
    anonymousId?: string;
  }>;
};

type LessonLocation = {
  phaseIndex: number;
  topicIndex: number;
  phaseName: string;
  topic: string;
};

function normalizeMode(value?: string): PlanMode {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function decodeValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function parsePositiveIndex(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isStoredPlan(value: unknown): value is MockPlan {
  const plan = asRecord(value);
  return typeof plan.title === 'string' && Array.isArray(plan.courseStructure) && Array.isArray(plan.roadmap);
}

function normalizeCourseStructure(payload: unknown): CourseStage[] {
  const plan = asRecord(payload);
  const courseStructure = safeArray(plan.courseStructure)
    .map((stage) => {
      const record = asRecord(stage);
      const stageName = String(record.stage || record.name || record.title || '').trim();
      const topics = safeArray(record.topics || record.learningCards || record.cards || record.tasks)
        .map((topic) => typeof topic === 'string' ? topic : String(asRecord(topic).title || asRecord(topic).name || ''))
        .map((topic) => topic.trim())
        .filter(Boolean);
      return stageName && topics.length ? { stage: stageName, topics } : null;
    })
    .filter((stage): stage is CourseStage => Boolean(stage));

  if (courseStructure.length > 0) return courseStructure;

  return safeArray(plan.roadmap)
    .map((stage) => {
      const record = asRecord(stage);
      const stageName = String(record.name || record.stage || record.title || '').trim();
      const topics = safeArray(record.topics || record.learningCards || record.cards || record.tasks)
        .map((topic) => typeof topic === 'string' ? topic : String(asRecord(topic).title || asRecord(topic).name || ''))
        .map((topic) => topic.trim())
        .filter(Boolean);
      return stageName && topics.length ? { stage: stageName, topics } : null;
    })
    .filter((stage): stage is CourseStage => Boolean(stage));
}

function resolveLocation(input: {
  phaseIndex: number;
  topicIndex: number;
  phaseName?: string;
  topic?: string;
  courseStructure: CourseStage[];
  fallbackGoal: string;
}): LessonLocation {
  const phase = input.courseStructure[input.phaseIndex - 1];
  const topicFromStructure = phase?.topics[input.topicIndex - 1];
  return {
    phaseIndex: input.phaseIndex,
    topicIndex: input.topicIndex,
    phaseName: decodeValue(input.phaseName, phase?.stage || '当前阶段'),
    topic: decodeValue(input.topic, topicFromStructure || input.fallbackGoal),
  };
}

function createLearnHref(params: { courseId?: string; goal: string; mode: PlanMode; phaseIndex: number; phaseName: string; topicIndex: number; topic: string }) {
  const searchParams = new URLSearchParams({
    goal: params.goal,
    mode: params.mode,
    phaseIndex: String(params.phaseIndex),
    phaseName: params.phaseName,
    topicIndex: String(params.topicIndex),
    topic: params.topic,
  });
  if (params.courseId) searchParams.set('courseId', params.courseId);
  return `/learn?${searchParams.toString()}`;
}

function createProgressHref(goal: string, mode: PlanMode, courseId?: string) {
  const params = new URLSearchParams({ goal, mode });
  if (courseId) params.set('courseId', courseId);
  return `/progress?${params.toString()}`;
}

function createNextHref(courseStructure: CourseStage[], current: LessonLocation, goal: string, mode: PlanMode, courseId?: string) {
  const currentPhase = courseStructure[current.phaseIndex - 1];
  const nextTopic = currentPhase?.topics[current.topicIndex];
  if (nextTopic) {
    return createLearnHref({ courseId, goal, mode, phaseIndex: current.phaseIndex, phaseName: currentPhase.stage, topicIndex: current.topicIndex + 1, topic: nextTopic });
  }

  const nextPhase = courseStructure[current.phaseIndex];
  const firstTopic = nextPhase?.topics[0];
  if (nextPhase && firstTopic) {
    return createLearnHref({ courseId, goal, mode, phaseIndex: current.phaseIndex + 1, phaseName: nextPhase.stage, topicIndex: 1, topic: firstTopic });
  }

  return courseId ? `/plan?courseId=${encodeURIComponent(courseId)}` : `/plan?${new URLSearchParams({ goal, mode }).toString()}`;
}

function createRegenerateHref(params: { goal: string; mode: PlanMode; courseId?: string; phaseName: string; topic: string; phaseIndex: number; topicIndex: number }) {
  const href = createLearnHref(params);
  return `${href}&regenerate=1`;
}

function getModeText(mode: PlanMode) {
  return mode === 'lite'
    ? { label: '快速学习', description: '精简讲解和练习，适合快速建立理解。' }
    : { label: '深度学习', description: '更完整的讲解、例题、练习、误区和检查点。' };
}

function getEstimatedMinutes(mode: PlanMode, answer: LearningAnswer) {
  const base = mode === 'lite' ? 16 : 28;
  return Math.max(base, answer.lessonSteps.length * 5 + answer.practice.length * 3);
}

function getDifficulty(mode: PlanMode) {
  return mode === 'lite' ? '入门' : '系统学习';
}

function findTaskId(goal: string, phaseName: string, topic: string, phaseIndex?: string, topicIndex?: string) {
  const stages = getProgressStagesByGoal(goal);
  const phaseNumber = Number(phaseIndex);
  const topicNumber = Number(topicIndex);
  const phase = Number.isInteger(phaseNumber) && phaseNumber > 0
    ? stages[phaseNumber - 1]
    : stages.find((stage) => stage.title === phaseName);

  if (!phase) return undefined;

  const task = Number.isInteger(topicNumber) && topicNumber > 0
    ? phase.tasks[topicNumber - 1]
    : phase.tasks.find((item) => item.title === topic);

  return task?.title === topic ? task.id : task?.id;
}

async function searchLearningResources(query: string) {
  try {
    const result = await Promise.race([
      searchResources(query),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new ResourceSearchError('资源搜索暂时失败，请稍后重试', 502)), RESOURCE_SEARCH_TIMEOUT_MS);
      }),
    ]);

    return { resources: [...result.resources].sort((a, b) => b.score - a.score).slice(0, 8), searchNotice: '' };
  } catch (error) {
    console.warn('Learning resource search fallback', error instanceof Error ? error.message : 'unknown error');
    return { resources: [] as SearchResource[], searchNotice: '已为你准备好本节课的学习内容。参考资料稍后可重新获取。' };
  }
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="break-words text-sm font-semibold text-sky-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
    </div>
  );
}

function FriendlyMissingState({ courseId }: { courseId?: string }) {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
        <section className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">暂时无法加载这节课</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {courseId ? '这个课程不存在、已失效，或当前账号没有访问权限。请从“我的课堂”或课程大纲重新进入。' : '缺少课程目标或学习点信息。请先生成课程大纲，再进入具体学习点。'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"><Home className="h-4 w-4" />返回首页</Link>
            <Link href={courseId ? `/plan?courseId=${encodeURIComponent(courseId)}` : '/'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"><ListChecks className="h-4 w-4" />返回课程大纲</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const params = await searchParams;
  const courseId = params.courseId?.trim() || '';
  const anonymousId = params.anonymousId?.trim() || undefined;
  const user = await getCurrentUser();
  const shouldRegenerate = params.regenerate === '1';

  let courseStructure: CourseStage[] = [];
  let courseGoal = decodeValue(params.goal, '学习');
  let mode = normalizeMode(params.mode);
  let courseTitle = courseGoal;
  let ownedCourse: Awaited<ReturnType<typeof getCourseOwnedByRequester>> = null;

  if (courseId) {
    ownedCourse = await getCourseOwnedByRequester({ courseId, userId: user?.id, anonymousId }).catch((error) => {
      console.warn('Learn course ownership check failed', error instanceof Error ? error.message : 'unknown');
      return null;
    });
    if (!ownedCourse || !ownedCourse.snapshots[0]) return <FriendlyMissingState courseId={courseId} />;
    courseGoal = ownedCourse.goal;
    mode = normalizeMode(ownedCourse.mode);
    courseTitle = ownedCourse.title || courseGoal;
    const payload = ownedCourse.snapshots[0].payload;
    if (isStoredPlan(payload)) courseTitle = payload.title || courseTitle;
    courseStructure = normalizeCourseStructure(payload);
  }

  const location = resolveLocation({
    phaseIndex: parsePositiveIndex(params.phaseIndex, 1),
    topicIndex: parsePositiveIndex(params.topicIndex, 1),
    phaseName: params.phaseName,
    topic: params.topic,
    courseStructure,
    fallbackGoal: courseGoal,
  });

  if (!courseId && !params.goal?.trim() && !params.topic?.trim()) return <FriendlyMissingState />;

  const progressHref = createProgressHref(courseGoal, mode, courseId);
  const planHref = courseId ? `/plan?courseId=${encodeURIComponent(courseId)}` : `/plan?${new URLSearchParams({ goal: courseGoal, mode }).toString()}`;
  const regenerateHref = createRegenerateHref({ goal: courseGoal, mode, courseId, ...location });
  const nextHref = createNextHref(courseStructure, location, courseGoal, mode, courseId);
  const modeText = getModeText(mode);
  const searchQuery = `${courseGoal} ${location.phaseName} ${location.topic} 学习资料 教程 例题 练习`;
  let restoredFromSession = false;
  let answer: LearningAnswer;
  let notice = '';

  const sessionAnonymousId = ownedCourse?.anonymousId || anonymousId;
  const canUseLearningSession = Boolean(courseId || sessionAnonymousId);
  const savedSession = canUseLearningSession && !shouldRegenerate
    ? await getLearningSession({ courseId, anonymousId: sessionAnonymousId, goal: courseGoal, mode, phaseIndex: location.phaseIndex, phaseName: location.phaseName, topicIndex: location.topicIndex, topicTitle: location.topic }).catch((error) => {
        console.warn('Learning session restore failed; generating fresh content.', error instanceof Error ? error.message : 'unknown');
        return null;
      })
    : null;

  if (savedSession?.content && typeof savedSession.content === 'object') {
    answer = sanitizeLearningAnswer(savedSession.content as unknown as LearningAnswer, { goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode, resources: [] });
    if ((!answer.references || answer.references.length === 0) && Array.isArray(savedSession.references)) {
      answer = { ...answer, references: savedSession.references as LearningAnswer['references'] };
    }
    restoredFromSession = true;
    notice = savedSession.fallbackUsed
      ? '已恢复上次生成的学习内容。你也可以点击“换一版讲解”获取另一版讲解。'
      : '已恢复上次生成的学习内容';
  } else {
    const usage = await checkUsageLimit({ userId: user?.id, anonymousId: sessionAnonymousId, tier: user?.membershipTier, type: 'learn_generate' });
    let resources: SearchResource[] = [];
    let searchNotice = '';

    if (!usage.allowed) {
      answer = getMockLearningAnswer({ goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode, resources: [] });
      notice = '今日学习卡片生成次数已用完。你可以先查看本节课内容，或升级会员获得更多额度。';
    } else {
      const searchResult = await searchLearningResources(searchQuery);
      resources = searchResult.resources;
      searchNotice = searchResult.searchNotice;
      answer = await generateLearningAnswer({ goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode, resources });
      notice = searchNotice || answer.notice || (shouldRegenerate ? '已为你换一版讲解内容。' : '');
      await incrementUsage('learn_generate', usage.scope);
    }

    const fallbackUsed = Boolean(answer.notice) || !usage.allowed;

    if (canUseLearningSession) {
      await upsertLearningSession({
        courseId: courseId || undefined,
        anonymousId: sessionAnonymousId,
        goal: courseGoal,
        mode,
        phaseIndex: location.phaseIndex,
        phaseName: location.phaseName,
        topicIndex: location.topicIndex,
        topicTitle: location.topic,
        title: answer.title,
        summary: answer.summary,
        searchQuery,
        content: answer,
        references: answer.references,
        fallbackUsed,
        source: fallbackUsed ? 'fallback' : 'ai',
      }).catch((error) => {
        console.warn('Learning session save failed; page content still rendered.', error instanceof Error ? error.message : 'unknown');
      });
    }
  }

  const safeAnswer: LearningAnswer = sanitizeLearningAnswer({
    ...answer,
    keyConcepts: Array.isArray(answer.keyConcepts) && answer.keyConcepts.length ? answer.keyConcepts : [location.topic, location.phaseName, courseGoal],
    lessonSteps: Array.isArray(answer.lessonSteps) && answer.lessonSteps.length ? answer.lessonSteps : getMockLearningAnswer({ goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode }).lessonSteps,
    examples: Array.isArray(answer.examples) ? answer.examples : [],
    practice: Array.isArray(answer.practice) && answer.practice.length ? answer.practice : getMockLearningAnswer({ goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode }).practice,
    commonMistakes: Array.isArray(answer.commonMistakes) ? answer.commonMistakes : [],
    checkpoint: Array.isArray(answer.checkpoint) && answer.checkpoint.length ? answer.checkpoint : ['能解释核心概念', '能完成基础练习', '知道下一步怎么学'],
    references: Array.isArray(answer.references) ? answer.references : [],
  }, { goal: courseGoal, phaseName: location.phaseName, topic: location.topic, mode, resources: [] });

  const taskId = findTaskId(courseGoal, location.phaseName, location.topic, String(location.phaseIndex), String(location.topicIndex));
  const estimatedMinutes = getEstimatedMinutes(mode, safeAnswer);
  const learningContextSummary = [
    `课程摘要：${safeAnswer.summary}`,
    `关键概念：${safeAnswer.keyConcepts.slice(0, 6).join('、')}`,
    ...safeAnswer.lessonSteps.slice(0, 3).map((step, index) => `步骤 ${index + 1}：${step.title}。${step.explanation}`),
  ].filter(Boolean).join('\n').slice(0, 1000);

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      {courseId ? <LastVisitedRecorder courseId={courseId} anonymousId={ownedCourse?.anonymousId || anonymousId} goal={courseGoal} mode={mode} lastPageType="learn" lastPhaseIndex={location.phaseIndex} lastPhaseName={location.phaseName} lastTopicIndex={location.topicIndex} lastTopicTitle={location.topic} /> : null}
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href={progressHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><ArrowLeft className="h-4 w-4" />返回进度页</Link>
            <Link href={planHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><ListChecks className="h-4 w-4" />返回课程大纲</Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><Home className="h-4 w-4" />返回首页</Link>
            <Link href={regenerateHref} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"><Sparkles className="h-4 w-4" />换一版讲解</Link>
          </div>

          <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-medium text-sky-800"><GraduationCap className="h-4 w-4" />AILINES AI 微课程</div>
              <p className="break-words text-sm font-semibold text-sky-700">{courseTitle} · {location.phaseName}</p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{safeAnswer.title}</h1>
              <p className="mt-4 max-w-3xl break-words text-base leading-8 text-slate-700 sm:text-lg">{safeAnswer.summary}</p>
              {notice ? <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">{notice}</p> : null}
              {restoredFromSession ? <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">已恢复上次生成的学习内容，本次没有重新搜索或调用 AI。</p> : null}
            </div>
            <aside className="min-w-0 rounded-3xl border border-white/80 bg-white/80 p-4 sm:p-5">
              <p className="text-sm font-semibold text-sky-800">当前完成状态</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2 break-words text-slate-700"><BookOpen className="h-4 w-4 text-sky-700" />主题：{location.topic}</div>
                <div className="flex min-w-0 items-center gap-2 break-words text-slate-700"><Clock3 className="h-4 w-4 text-sky-700" />预计 {estimatedMinutes} 分钟</div>
                <div className="flex min-w-0 items-center gap-2 break-words text-slate-700"><Layers3 className="h-4 w-4 text-sky-700" />难度：{getDifficulty(mode)}</div>
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-800"><span className="font-semibold">{modeText.label}</span><p className="mt-1 leading-6 text-slate-600">{modeText.description}</p></div>
              </div>
            </aside>
          </div>
        </section>

        <section id="objectives" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="你将学会" title="这节课的学习目标" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {safeAnswer.checkpoint.slice(0, 5).map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{item}</div>)}
          </div>
        </section>

        <section id="concepts" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="核心概念" title={`围绕「${location.topic}」先理解这些关键点`} />
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {safeAnswer.keyConcepts.slice(0, 6).map((concept, index) => (
              <article key={`${concept}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="break-words font-semibold text-slate-950">{concept}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">围绕「{location.topic}」理解「{concept}」：先看它解决的问题，再结合本节示例完成一次可检查的小练习。</p>
                <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-amber-800"><span className="font-semibold">练习建议：</span>把「{concept}」写进一个具体步骤、题目、代码、作品或操作记录里。</p>
              </article>
            ))}
          </div>
        </section>

        <section id="lesson" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="课程讲解" title="按老师讲课的节奏理解它" />
          <div className="mt-6 space-y-4">
            {safeAnswer.lessonSteps.map((step, index) => (
              <article key={`${step.title}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-700 text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <h3 className="break-words text-lg font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-3 break-words text-sm leading-7 text-slate-700 sm:text-base">{step.explanation}</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="min-w-0 break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="break-words font-semibold text-slate-950">例子：</span>{step.example}</div>
                      <div className="min-w-0 break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="break-words font-semibold text-slate-950">行动：</span>{step.action}</div>
                      <div className="min-w-0 break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="break-words font-semibold text-slate-950">检查：</span>{step.check}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="examples" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="示例" title="看一遍完整案例或解法" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {safeAnswer.examples.map((example, index) => (
              <article key={`${example.title}-${index}`} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <h3 className="break-words font-semibold text-slate-950">{example.title}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-slate-700">{example.content}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  {example.solution.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <LearnInteractiveLesson answer={safeAnswer} completion={{ goal: courseGoal, mode, courseId, taskId, phaseIndex: location.phaseIndex, phaseName: location.phaseName, topicIndex: location.topicIndex - 1, topic: location.topic, progressHref }} nextHref={nextHref} planHref={planHref} />

        <section id="summary" className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="课堂总结" title="本节课重点回顾" />
            <ul className="mt-5 space-y-3">
              {safeAnswer.checkpoint.slice(0, 5).map((item) => <li key={item} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}
            </ul>
          </div>
          <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="下一步推荐" title="学完后怎么继续" />
            <p className="mt-4 break-words text-sm leading-7 text-slate-700">先确认你能完成本节练习和小测验。如果得分不稳定，建议回到“课程讲解”和“示例”重做一遍；如果已经掌握，就点击继续下一节。</p>
            {safeAnswer.commonMistakes.length ? <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">{safeAnswer.commonMistakes.slice(0, 4).map((mistake) => <li key={mistake} className="rounded-2xl border border-amber-100 bg-amber-50 p-3">常见误区：{mistake}</li>)}</ul> : null}
          </div>
        </section>

        {safeAnswer.references.length ? (
          <section id="references" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="参考资料" title="继续深入阅读" />
            <p className="mt-4 text-sm leading-6 text-slate-600">以下资料已被 AILINES AI 用于整理本课内容，你可以继续深入阅读。</p>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">{safeAnswer.resourceSummary}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {safeAnswer.references.map((resource) => (
                <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="break-words text-xs font-semibold text-sky-700">{resource.source} · {resource.type}</p><h3 className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">{resource.title}</h3></div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-sky-700" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <FloatingAilinesChat pageType="learn" goal={courseGoal} mode={mode} phaseName={location.phaseName} topic={location.topic} contextTitle={location.topic} contextSummary={learningContextSummary} />
    </main>
  );
}

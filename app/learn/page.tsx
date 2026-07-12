import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, Home, ListChecks, Sparkles } from 'lucide-react';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { LearnCompletionButton } from '@/components/LearnCompletionButton';
import { SiteHeader } from '@/components/site-header';
import { generateLearningAnswer } from '@/lib/ai/generateLearningAnswer';
import type { PlanMode } from '@/lib/ai/types';
import { getLearningSession, upsertLearningSession } from '@/lib/course/learningSessionRepository';
import type { LearningAnswer } from '@/lib/learning/mockLearningAnswer';
import { getProgressStagesByGoal } from '@/lib/mockProgress';
import { ResourceSearchError, searchResources } from '@/lib/search/searchResources';
import type { SearchResource } from '@/lib/search/resourceTypes';

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
  }>;
};

function normalizeMode(value?: string): PlanMode {
  return value === 'lite' || value === 'deep' ? value : 'deep';
}

function decodeValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function getModeText(mode: PlanMode) {
  return mode === 'lite'
    ? { label: '快速学习', description: '精简讲解和练习，适合快速建立理解。' }
    : { label: '深度学习', description: '更完整的讲解、例题、练习、误区和检查点。' };
}

function createProgressHref(goal: string, mode: PlanMode, courseId?: string) {
  const params = new URLSearchParams({ goal, mode });
  if (courseId) params.set('courseId', courseId);
  return `/progress?${params.toString()}`;
}

function createRegenerateHref(params: {
  goal: string;
  mode: PlanMode;
  courseId?: string;
  phaseName: string;
  topic: string;
  phaseIndex: number;
  topicIndex: number;
}) {
  const searchParams = new URLSearchParams({
    goal: params.goal,
    mode: params.mode,
    phaseName: params.phaseName,
    topic: params.topic,
    phaseIndex: String(params.phaseIndex),
    topicIndex: String(params.topicIndex),
    regenerate: '1',
  });
  if (params.courseId) searchParams.set('courseId', params.courseId);
  return `/learn?${searchParams.toString()}`;
}

function parsePositiveIndex(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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

    return {
      resources: [...result.resources].sort((a, b) => b.score - a.score).slice(0, 8),
      searchNotice: '',
    };
  } catch (error) {
    console.warn('Learning resource search fallback', error instanceof Error ? error.message : 'unknown error');
    return {
      resources: [] as SearchResource[],
      searchNotice: '暂未获取到可用资料，已先提供基础课程。',
    };
  }
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-sky-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
    </div>
  );
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const params = await searchParams;
  const goal = decodeValue(params.goal, '学习');
  const mode = normalizeMode(params.mode);
  const phaseName = decodeValue(params.phaseName, '当前阶段');
  const topic = decodeValue(params.topic, goal);
  const courseId = params.courseId?.trim() || '';
  const phaseIndex = parsePositiveIndex(params.phaseIndex, 1);
  const topicIndex = parsePositiveIndex(params.topicIndex, 1);
  const modeText = getModeText(mode);
  const progressHref = createProgressHref(goal, mode, courseId);
  const planHref = courseId ? `/plan?courseId=${encodeURIComponent(courseId)}` : `/plan?${new URLSearchParams({ goal, mode }).toString()}`;
  const regenerateHref = createRegenerateHref({ goal, mode, courseId, phaseName, topic, phaseIndex, topicIndex });
  const shouldRegenerate = params.regenerate === '1';
  const searchQuery = `${goal} ${phaseName} ${topic} 学习资料 教程 例题 练习`;
  let restoredFromSession = false;
  let sessionFallbackUsed = false;
  let answer: LearningAnswer;
  let notice = '';

  const savedSession = courseId && !shouldRegenerate
    ? await getLearningSession({ courseId, goal, mode, phaseIndex, phaseName, topicIndex, topicTitle: topic }).catch((error) => {
        console.warn('Learning session restore failed; generating fresh content.', error instanceof Error ? error.message : 'unknown');
        return null;
      })
    : null;

  if (savedSession?.content && typeof savedSession.content === 'object') {
    answer = savedSession.content as unknown as LearningAnswer;
    if ((!answer.references || answer.references.length === 0) && Array.isArray(savedSession.references)) {
      answer = { ...answer, references: savedSession.references as LearningAnswer['references'] };
    }
    restoredFromSession = true;
    sessionFallbackUsed = savedSession.fallbackUsed;
    notice = savedSession.fallbackUsed
      ? '已恢复上次生成的学习内容（上次使用基础 fallback 课程）。你可以点击“重新生成本课”再次尝试 AILINES AI 整合。'
      : '已恢复上次生成的学习内容';
  } else {
    const { resources, searchNotice } = await searchLearningResources(searchQuery);
    answer = await generateLearningAnswer({ goal, phaseName, topic, mode, resources });
    const fallbackUsed = Boolean(answer.notice);
    notice = searchNotice || answer.notice || (shouldRegenerate ? '已按你的要求重新生成本课内容。' : '');

    if (courseId) {
      await upsertLearningSession({
        courseId,
        goal,
        mode,
        phaseIndex,
        phaseName,
        topicIndex,
        topicTitle: topic,
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

  const taskId = findTaskId(goal, phaseName, topic, params.phaseIndex, params.topicIndex);
  const learningContextSummary = [
    `课程摘要：${answer.summary}`,
    `关键概念：${answer.keyConcepts.slice(0, 6).join('、')}`,
    ...answer.lessonSteps.slice(0, 3).map((step, index) => `步骤 ${index + 1}：${step.title}。${step.explanation}`),
  ].filter(Boolean).join('\n').slice(0, 1000);

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      {courseId ? <LastVisitedRecorder courseId={courseId} goal={goal} mode={mode} lastPageType="learn" lastPhaseIndex={phaseIndex} lastPhaseName={phaseName} lastTopicIndex={topicIndex} lastTopicTitle={topic} /> : null}
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="flex flex-wrap gap-3">
            <Link href={progressHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <ArrowLeft className="h-4 w-4" />
              返回进度页
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <Link href={planHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <ListChecks className="h-4 w-4" />
              返回方案页
            </Link>
            <Link href={regenerateHref} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100">
              <Sparkles className="h-4 w-4" />
              重新生成本课
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
                <Sparkles className="h-4 w-4" />
                AILINES AI 学习卡片
              </div>
              <p className="text-sm font-semibold text-sky-700">{phaseName}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{answer.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{answer.summary}</p>
              {notice ? <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">{notice}</p> : null}
              {restoredFromSession ? <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">已恢复上次生成的学习内容，本次没有重新搜索或调用 AI。</p> : null}
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
              <p className="text-sm font-semibold text-sky-800">当前模式：{modeText.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{modeText.description}</p>
              <div className="mt-4">
                <LearnCompletionButton goal={goal} mode={mode} courseId={courseId} taskId={taskId} phaseIndex={phaseIndex} phaseName={phaseName} topicIndex={topicIndex - 1} topic={topic} progressHref={progressHref} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="课程导入" title="这个主题要解决什么问题" />
          <p className="mt-4 text-base leading-8 text-slate-700">
            你正在学习「{goal}」中的「{topic}」。这节课的目标不是让你只看一组搜索结果，而是把资料中的概念、例题和练习整合成一节可完成的课程。学完后，你应该能解释核心概念、完成基础练习，并知道下一步怎么检查自己是否掌握。
          </p>
          {answer.keyConcepts.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {answer.keyConcepts.map((concept) => (
                <span key={concept} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">{concept}</span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <SectionTitle eyebrow="AILINES AI 整合讲解" title="按步骤学会这一项" />
          <div className="mt-6 space-y-4">
            {answer.lessonSteps.map((step, index) => (
              <article key={`${step.title}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-700 text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{step.explanation}</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">例子：</span>{step.example}</div>
                      <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">行动：</span>{step.action}</div>
                      <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">检查：</span>{step.check}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="例题/案例" title="看一遍完整解法" />
            <div className="mt-5 space-y-4">
              {answer.examples.map((example) => (
                <article key={example.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">{example.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{example.content}</p>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {example.solution.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="练习" title="用题目检查掌握程度" />
            <div className="mt-5 space-y-4">
              {answer.practice.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700">{item.difficulty}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.task}</p>
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">检查：</span>{item.check}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="常见误区" title="提前避开这些坑" />
            <ul className="mt-5 space-y-3">
              {answer.commonMistakes.map((mistake) => (
                <li key={mistake} className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{mistake}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="完成检查" title="学完应该能做到什么" />
            <ul className="mt-5 space-y-3">
              {answer.checkpoint.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <LearnCompletionButton goal={goal} mode={mode} courseId={courseId} taskId={taskId} phaseIndex={phaseIndex} phaseName={phaseName} topicIndex={topicIndex - 1} topic={topic} progressHref={progressHref} />
            </div>
          </div>
        </section>

        {answer.references.length ? (
          <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <SectionTitle eyebrow="参考资料" title="继续深入阅读" />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              以下资料已被 AILINES AI 用于整理本课内容，你可以继续深入阅读。
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{answer.resourceSummary}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {answer.references.map((resource) => (
                <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-sky-700">{resource.source} · {resource.type}</p>
                      <h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">{resource.title}</h3>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-sky-700" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <FloatingAilinesChat
        pageType="learn"
        goal={goal}
        mode={mode}
        phaseName={phaseName}
        topic={topic}
        contextTitle={topic}
        contextSummary={learningContextSummary}
      />
    </main>
  );
}

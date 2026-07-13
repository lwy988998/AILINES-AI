import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ListChecks, PackageCheck, RefreshCw, Route, Target } from 'lucide-react';
import { FloatingAilinesChat } from '@/components/assistant/FloatingAilinesChat';
import { CourseProgressBanner } from '@/components/course/CourseProgressBanner';
import { LastVisitedRecorder } from '@/components/course/LastVisitedRecorder';
import { PlanActions } from '@/components/PlanActions';
import type { PlanMode } from '@/lib/ai/types';
import type { CourseProgressSummary } from '@/lib/course/courseProgressRepository';
import type { MockPlan, ResourceItem, RoadmapStage } from '@/lib/mockPlan';

type LitePlanViewProps = {
  goal: string;
  mode: PlanMode;
  plan: MockPlan;
  resourceSourceMessage: string;
  notice?: React.ReactNode;
  courseId?: string;
  courseProgress?: CourseProgressSummary | null;
};

type LiteStep = {
  title: string;
  description: string;
  action?: string;
  check?: string;
};

function stripStepPrefix(value: string) {
  return value.replace(/^第\s*\d+\s*[步阶段]?[:：、-]?\s*/, '').trim();
}

function titleForGoal(goal: string, planTitle?: string) {
  const safeGoal = goal.trim() || '你的目标';
  const normalizedTitle = (planTitle || '').trim();
  if (normalizedTitle && !/通用技能学习方案/.test(normalizedTitle)) return normalizedTitle;
  return `${safeGoal}快速学习方案`;
}

function getCoreSteps(plan: MockPlan): LiteStep[] {
  const stepItems = plan.roadmap.flatMap((stage) =>
    (stage.steps || []).map((step) => ({
      title: stripStepPrefix(step.title || stage.name),
      description: step.explanation || stage.description,
      action: step.action,
      check: step.check,
    })),
  );

  if (stepItems.length > 0) return stepItems.slice(0, 5);

  return plan.roadmap.slice(0, 5).map((stage) => ({
    title: stripStepPrefix(stage.name),
    description: stage.description || stage.goal,
    action: stage.practice,
    check: stage.checkpoint,
  }));
}

function getMaterials(plan: MockPlan) {
  const prerequisites = Array.isArray(plan.prerequisites) ? plan.prerequisites.filter(Boolean) : [];
  if (prerequisites.length > 0) return prerequisites.slice(0, 5);

  const topics = plan.courseStructure.flatMap((stage) => stage.topics).filter(Boolean);
  return topics.slice(0, 5);
}

function getPracticeItems(plan: MockPlan, stages: RoadmapStage[]) {
  const items = stages.flatMap((stage) => [stage.practice, stage.output, stage.checkpoint]).filter((item): item is string => Boolean(item && item.trim()));
  if (items.length > 0) return items.slice(0, 4);
  return ['今天先完成 3 次完整练习', '每次练习后记录哪里卡住', '用自检标准判断是否合格'];
}

function getMistakes(plan: MockPlan, stages: RoadmapStage[]) {
  const mistakes = stages.flatMap((stage) => stage.commonMistakes || []).filter(Boolean);
  if (mistakes.length > 0) return [...new Set(mistakes)].slice(0, 5);
  return ['只看教程不动手', '跳过关键检查步骤', '没有记录失败原因', '练习次数太少就进入下一步'];
}

function LiteResources({ resources, message }: { resources: ResourceItem[]; message: string }) {
  const visibleResources = resources.slice(0, 5);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-5">
        <p className="text-sm font-semibold text-sky-700">可参考资料</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">少量资料，先别被信息淹没</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{visibleResources.length > 0 ? message : '暂未获取到资料，先按基础步骤练习。'}</p>
      </div>
      {visibleResources.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleResources.map((resource) => (
            <a key={`${resource.name}-${resource.href}`} href={resource.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50">
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-800">{resource.type}</span>
                <span className="rounded-full bg-white px-2 py-1 text-slate-600">{resource.difficulty}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-950">{resource.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{resource.description}</p>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function LitePlanView({ goal, mode, plan, resourceSourceMessage, notice, courseId, courseProgress }: LitePlanViewProps) {
  const title = titleForGoal(goal, plan.title);
  const stages = plan.roadmap.slice(0, 5);
  const coreSteps = getCoreSteps(plan);
  const materials = getMaterials(plan);
  const practiceItems = getPracticeItems(plan, stages);
  const mistakes = getMistakes(plan, stages);
  const firstStage = stages[0];
  const encodedGoal = encodeURIComponent(goal);
  const encodedMode = encodeURIComponent(mode);

  return (
    <>
      {courseId ? <LastVisitedRecorder courseId={courseId} goal={goal} mode={mode} lastPageType="plan" /> : null}
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
            <Route className="h-4 w-4" />
            快速规划
          </div>
          <h1 className="mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">{plan.summary || `这是一份轻量实践方案，帮助你围绕“${goal}”先抓住核心步骤、练习方法和常见错误，马上开始做。`}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
              <p className="text-xs font-semibold text-slate-500">当前模式</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">快速规划</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
              <p className="text-xs font-semibold text-slate-500">建议周期</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{plan.duration || '1-3 天'}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
              <p className="text-xs font-semibold text-slate-500">重点</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">先做会，再深入</p>
            </div>
          </div>
        </section>

        {courseProgress ? <CourseProgressBanner progress={courseProgress} /> : null}
        {notice}

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-800"><ListChecks className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-sky-700">核心步骤</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">先按这几步开始</h2>
              </div>
            </div>
            <div className="space-y-4">
              {coreSteps.map((step, index) => (
                <article key={`${step.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-sky-700">第 {index + 1} 步</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                  {step.action || step.check ? (
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      {step.action ? <p className="rounded-xl bg-white p-3 text-slate-700"><span className="font-semibold text-slate-950">怎么做：</span>{step.action}</p> : null}
                      {step.check ? <p className="rounded-xl bg-white p-3 text-slate-700"><span className="font-semibold text-slate-950">怎么验收：</span>{step.check}</p> : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-sky-900/5">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">必备材料 / 工具</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {materials.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm shadow-sky-900/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-950">常见错误</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {mistakes.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </section>
          </aside>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><ClipboardCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">练习清单</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">今天就这样练</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {practiceItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p className="mb-2 font-semibold text-slate-950">清单 {index + 1}</p>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">下一步建议</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">完成第一轮练习后再深入</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">先完成第一轮操作和自检。如果你发现某一步不稳定，再进入进度页逐项练习，或切换深度规划生成完整课程。</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/progress?goal=${encodedGoal}&mode=${encodedMode}${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ''}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800">进入进度追踪</Link>
              {firstStage ? <Link href={`/phase?goal=${encodedGoal}&mode=${encodedMode}${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ''}&phaseIndex=1&phaseName=${encodeURIComponent(firstStage.name)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-100">开始第一个阶段</Link> : null}
              <Link href={`/plan?goal=${encodedGoal}&mode=lite&forcePlan=1&retry=${Date.now()}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCw className="h-4 w-4" />重新生成</Link>
            </div>
          </div>
        </section>

        <LiteResources resources={plan.resources} message={resourceSourceMessage} />
        <PlanActions goal={goal} title={title} mode={mode} courseId={courseId} />
      </div>
      <FloatingAilinesChat
        pageType="plan"
        goal={goal}
        mode={mode}
        contextTitle={title}
        contextSummary={[plan.summary, ...coreSteps.map((step) => `${step.title}：${step.description}`)].filter(Boolean).join('\n').slice(0, 1000)}
      />
    </>
  );
}

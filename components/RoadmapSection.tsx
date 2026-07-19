import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, PlayCircle, Target } from 'lucide-react';
import { createLearnHref, createPhaseHref, createProgressLookup, getStageTopics } from '@/lib/course/courseLearningNavigation';
import type { LearningCardProgressItem } from '@/lib/course/learningCardProgressRepository';
import type { CourseStage, RoadmapStage } from '@/lib/mockPlan';

type RoadmapSectionProps = {
  goal: string;
  stages: RoadmapStage[];
  courseStructure?: CourseStage[];
  mode?: 'lite' | 'deep';
  courseId?: string;
  anonymousId?: string;
  cardProgressItems?: LearningCardProgressItem[];
};

export function RoadmapSection({ goal, stages, courseStructure = [], mode = 'deep', courseId, anonymousId, cardProgressItems = [] }: RoadmapSectionProps) {
  const getStatus = createProgressLookup(cardProgressItems);
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">学习路线</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">分阶段推进，每个阶段都有入口</h2>
      </div>
      <div className="stagger-fade grid gap-4 lg:grid-cols-2">
        {stages.map((stage, index) => {
          const phaseNo = index + 1;
          const phaseHref = createPhaseHref({ goal, mode, courseId, anonymousId, phaseIndex: phaseNo, phaseName: stage.name });
          const topics = getStageTopics(stage, courseStructure[index]);
          const firstTopic = topics[0];
          const firstLearnHref = firstTopic ? createLearnHref({ goal, mode, courseId, anonymousId, phaseIndex: phaseNo, phaseName: stage.name, topicIndex: 1, topic: firstTopic }) : phaseHref;
          const completedCount = topics.filter((_topic, topicIndex) => getStatus(phaseNo, topicIndex + 1) === 'completed').length;
          const inProgressCount = topics.filter((_topic, topicIndex) => getStatus(phaseNo, topicIndex + 1) === 'in_progress').length;
          const phaseCompleted = topics.length > 0 && completedCount >= topics.length;
          const phaseLearning = !phaseCompleted && (completedCount > 0 || inProgressCount > 0);

          return (
            <article key={stage.name} className="group interactive-card min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 hover:bg-sky-50">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-semibold text-white transition group-hover:bg-sky-800">
                  {phaseNo}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-semibold text-slate-950 transition group-hover:text-sky-900">{stage.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                      <Clock3 className="h-3.5 w-3.5 text-sky-700" />
                      {stage.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                      <Target className="h-3.5 w-3.5 text-sky-700" />
                      {topics.length} 个学习点
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${phaseCompleted ? 'bg-emerald-100 text-emerald-700' : phaseLearning ? 'bg-sky-100 text-sky-800' : 'bg-white text-slate-600'}`}>
                      {phaseCompleted ? '已完成' : phaseLearning ? `学习中 ${completedCount}/${topics.length}` : '未开始'}
                    </span>
                  </div>
                  <p className="mt-4 break-words font-medium leading-7 text-slate-800">{stage.goal}</p>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{stage.description || '暂无说明'}</p>
                  {stage.output ? <p className="mt-3 break-words rounded-xl bg-white p-3 text-sm font-medium leading-6 text-slate-700">阶段产出：{stage.output}</p> : null}
                  {stage.checkpoint ? <p className="mt-2 break-words text-sm leading-6 text-slate-600">检查点：{stage.checkpoint}</p> : null}
                  <div className="mobile-button-stack mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link href={phaseHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-800 interactive-button transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                      <BookOpen className="h-4 w-4" />查看阶段
                    </Link>
                    <Link href={firstLearnHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-3 text-sm font-semibold text-white interactive-button transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
                      <PlayCircle className="h-4 w-4" />开始本阶段
                    </Link>
                    {firstTopic ? (
                      <Link href={firstLearnHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 interactive-button transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
                        进入第一个知识点<ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

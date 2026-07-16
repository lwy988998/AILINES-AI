'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Layers3, Lightbulb, Presentation, RotateCcw, Sparkles, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PlanMode } from '@/lib/ai/types';
import type { CourseSlide, RoadmapStage } from '@/lib/mockPlan';

type CourseSlidesProps = {
  slides?: CourseSlide[];
  phases?: RoadmapStage[];
  title?: string;
  description?: string;
  goal?: string;
  mode?: PlanMode;
  courseId?: string;
  anonymousId?: string;
};

type InteractiveConcept = {
  title: string;
  detail: string;
};

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeBullets(bullets?: string[]) {
  return Array.isArray(bullets) ? bullets.filter(isNonEmptyText) : [];
}

function stripPrefix(value: string) {
  return value.replace(/^(例子|现在你要做|完成检查|输出|目标|练习|检查点)[:：]\s*/i, '').trim();
}

function compactText(value: string, maxLength = 52) {
  const text = value.trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function slidesFromPhases(phases?: RoadmapStage[]): CourseSlide[] {
  const safePhases = Array.isArray(phases) ? phases : [];
  if (!safePhases.length) {
    return [
      {
        title: '课程导入',
        subtitle: 'AILINES AI 互动课件',
        content: '这组课件会把学习目标拆成课程导入、阶段重点、行动建议和完成检查，帮助你边看边练、逐步推进学习。',
        bullets: ['先理解整体结构', '再逐步学习阶段内容', '最后用练习和检查点确认掌握'],
        speakerNote: '先浏览课程结构，再选择当前最重要的阶段开始学习。',
      },
    ];
  }

  return safePhases.flatMap((phase, index) => {
    const baseSlide: CourseSlide = {
      title: phase.name || `阶段 ${index + 1}`,
      subtitle: phase.goal || '阶段目标',
      content: phase.description || phase.why || '理解本阶段重点，并通过练习形成可检查的能力。',
      bullets: [phase.duration, phase.output, phase.checkpoint].filter(isNonEmptyText),
      speakerNote: phase.why || '讲解本阶段为什么重要，以及用户完成后应该获得什么能力。',
      relatedPhase: phase.name,
    };

    const stepSlides = (Array.isArray(phase.steps) ? phase.steps : []).slice(0, 2).map((step) => ({
      title: step.title,
      subtitle: phase.name,
      content: step.explanation,
      bullets: [step.example ? `例子：${step.example}` : '', `现在你要做：${step.action}`, `完成检查：${step.check}`].filter(isNonEmptyText),
      speakerNote: '按照“讲解、例子、行动、检查”的顺序完成这一页。',
      relatedPhase: phase.name,
    }));

    return [baseSlide, ...stepSlides];
  });
}

function getSlideConcepts(slide: CourseSlide | undefined, bullets: string[]): InteractiveConcept[] {
  const concepts = bullets.length > 0
    ? bullets.slice(0, 5).map((bullet, index) => ({
      title: compactText(stripPrefix(bullet), 34) || `知识点 ${index + 1}`,
      detail: stripPrefix(bullet),
    }))
    : [];

  if (concepts.length > 0) return concepts;

  if (isNonEmptyText(slide?.content)) {
    return [{ title: '本页核心理解', detail: slide.content }];
  }

  return [{ title: '学习重点', detail: '先理解本页目标，再完成对应练习，并用检查标准确认掌握。' }];
}

function getPhaseIndex(slide: CourseSlide | undefined, phases?: RoadmapStage[]) {
  if (!Array.isArray(phases) || phases.length === 0 || !isNonEmptyText(slide?.relatedPhase)) return 1;
  const index = phases.findIndex((phase) => phase.name === slide.relatedPhase);
  return index >= 0 ? index + 1 : 1;
}

function createLearnHref(input: { goal: string; mode: PlanMode; courseId?: string; anonymousId?: string; phaseIndex: number; phaseName: string; topic: string }) {
  const params = new URLSearchParams({
    goal: input.goal,
    mode: input.mode,
    phaseIndex: String(input.phaseIndex),
    phaseName: input.phaseName,
    topicIndex: '1',
    topic: input.topic,
  });
  if (input.courseId) params.set('courseId', input.courseId);
  if (input.anonymousId) params.set('anonymousId', input.anonymousId);
  return `/learn?${params.toString()}`;
}

export function CourseSlides({ slides, phases, title = 'AILINES AI 互动课件', description = '用可点击、可练习的课件卡片快速理解本课程的学习路径和核心知识。', goal, mode = 'deep', courseId, anonymousId }: CourseSlidesProps) {
  const preparedSlides = useMemo(() => {
    const provided = Array.isArray(slides) ? slides.filter((slide) => isNonEmptyText(slide.title) || isNonEmptyText(slide.content)) : [];
    return provided.length > 0 ? provided : slidesFromPhases(phases);
  }, [slides, phases]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedConceptIndex, setExpandedConceptIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set());
  const total = preparedSlides.length || 1;
  const safeCurrentIndex = Math.min(currentIndex, total - 1);
  const currentSlide = preparedSlides[safeCurrentIndex] || preparedSlides[0];
  const bullets = normalizeBullets(currentSlide?.bullets);
  const concepts = getSlideConcepts(currentSlide, bullets);
  const isFirst = safeCurrentIndex <= 0;
  const isLast = safeCurrentIndex >= total - 1;
  const progressPercent = Math.round(((safeCurrentIndex + 1) / total) * 100);
  const currentCompleted = completedSlides.has(safeCurrentIndex);
  const phaseIndex = getPhaseIndex(currentSlide, phases);
  const phaseName = currentSlide?.relatedPhase || currentSlide?.subtitle || currentSlide?.title || '当前阶段';
  const topic = currentSlide?.title || phaseName;
  const canOpenLearn = Boolean(goal && topic);
  const learnHref = canOpenLearn ? createLearnHref({ goal: goal!, mode, courseId, anonymousId, phaseIndex, phaseName, topic }) : '';

  function setSlide(index: number) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
    setExpandedConceptIndex(0);
    setShowHint(false);
  }

  function goPrevious() {
    setSlide(safeCurrentIndex - 1);
  }

  function goNext() {
    setSlide(safeCurrentIndex + 1);
  }

  function toggleCompleted() {
    setCompletedSlides((current) => {
      const next = new Set(current);
      if (next.has(safeCurrentIndex)) {
        next.delete(safeCurrentIndex);
      } else {
        next.add(safeCurrentIndex);
      }
      return next;
    });
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/70 p-4 shadow-md shadow-sky-900/8 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Presentation className="h-4 w-4" />互动课程课件</p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 break-words text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
          <span>{safeCurrentIndex + 1}</span>
          <span className="text-sky-300">/</span>
          <span>{total}</span>
          <span className="text-slate-300">·</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-sky-100">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {preparedSlides.map((slide, index) => {
          const selected = index === safeCurrentIndex;
          const done = completedSlides.has(index);
          return (
            <button
              key={`${slide.title}-${index}`}
              type="button"
              onClick={() => setSlide(index)}
              className={`min-w-[180px] max-w-[240px] rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${selected ? 'border-sky-300 bg-white text-sky-900 shadow-sm' : 'border-white/80 bg-white/65 text-slate-600 hover:border-sky-200 hover:bg-white'}`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Layers3 className="h-3.5 w-3.5 text-sky-600" />}
                第 {index + 1} 页
              </span>
              <span className="mt-1 line-clamp-2 block font-semibold">{slide.title || '课程页'}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-sm shadow-sky-900/5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">第 {safeCurrentIndex + 1} 页</span>
              {isNonEmptyText(currentSlide?.relatedPhase) ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{currentSlide.relatedPhase}</span> : null}
              {currentCompleted ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">已掌握</span> : null}
            </div>
          </div>

          <div className="mt-6 max-w-4xl min-w-0">
            <h3 className="break-words text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">{currentSlide?.title || '课程课件'}</h3>
            {isNonEmptyText(currentSlide?.subtitle) ? <p className="mt-3 break-words text-base font-semibold leading-7 text-sky-800 sm:text-lg">{currentSlide.subtitle}</p> : null}
            {isNonEmptyText(currentSlide?.content) ? <p className="mt-5 break-words text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{currentSlide.content}</p> : null}
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {concepts.map((concept, index) => {
              const expanded = expandedConceptIndex === index;
              return (
                <button
                  key={`${concept.title}-${index}`}
                  type="button"
                  onClick={() => setExpandedConceptIndex(expanded ? -1 : index)}
                  className={`min-w-0 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${expanded ? 'border-sky-200 bg-sky-50/80' : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'}`}
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-sky-700 shadow-sm">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="break-words text-sm font-semibold text-slate-950">{concept.title}</span>
                      {expanded ? <span className="mt-2 block break-words text-sm leading-6 text-slate-600">{concept.detail}</span> : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-sky-100 bg-white/85 p-5 shadow-sm shadow-sky-900/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
              <Lightbulb className="h-4 w-4" />快速检查
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">看完这一页后，先用一句话说出本页重点，再完成一个最小动作。</p>
            <button type="button" onClick={() => setShowHint((value) => !value)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
              {showHint ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showHint ? '收起提示' : '查看提示'}
            </button>
            {showHint ? (
              <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-slate-700">
                {isNonEmptyText(currentSlide?.speakerNote) ? currentSlide.speakerNote : '把本页标题、关键概念和行动项串成一句话，再检查自己是否能独立复述。'}
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-emerald-100 bg-white/85 p-5 shadow-sm shadow-sky-900/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Target className="h-4 w-4" />学习动作
            </div>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={toggleCompleted} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${currentCompleted ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>
                <CheckCircle2 className="h-4 w-4" />{currentCompleted ? '已标记掌握' : '标记掌握'}
              </button>
              {canOpenLearn ? (
                <Link href={learnHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
                  <BookOpen className="h-4 w-4" />进入微课程
                </Link>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button type="button" onClick={goPrevious} disabled={isFirst} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">
          <ChevronLeft className="h-4 w-4" />上一页
        </button>
        <button type="button" onClick={() => setSlide(0)} disabled={isFirst} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">
          <RotateCcw className="h-4 w-4" />回到第一张
        </button>
        <button type="button" onClick={goNext} disabled={isLast} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white">
          下一页<ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
        <span>本页掌握状态仅用于当前浏览，不会改变你的课程进度记录。</span>
      </div>
    </section>
  );
}

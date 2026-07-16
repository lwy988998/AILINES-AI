'use client';

import { ChevronLeft, ChevronRight, Presentation, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CourseSlide, RoadmapStage } from '@/lib/mockPlan';

type CourseSlidesProps = {
  slides?: CourseSlide[];
  phases?: RoadmapStage[];
  title?: string;
  description?: string;
};

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeBullets(bullets?: string[]) {
  return Array.isArray(bullets) ? bullets.filter(isNonEmptyText) : [];
}

function slidesFromPhases(phases?: RoadmapStage[]): CourseSlide[] {
  const safePhases = Array.isArray(phases) ? phases : [];
  if (!safePhases.length) {
    return [
      {
        title: '课程导入',
        subtitle: 'AILINES AI 课程课件',
        content: '这组课件会把学习目标拆成课程导入、阶段重点、行动建议和完成检查，帮助你像上课一样推进学习。',
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

export function CourseSlides({ slides, phases, title = 'AILINES AI 课程课件', description = '以课件卡片的方式快速理解本课程的学习路径和核心知识。' }: CourseSlidesProps) {
  const preparedSlides = useMemo(() => {
    const provided = Array.isArray(slides) ? slides.filter((slide) => isNonEmptyText(slide.title) || isNonEmptyText(slide.content)) : [];
    return provided.length > 0 ? provided : slidesFromPhases(phases);
  }, [slides, phases]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = preparedSlides.length || 1;
  const currentSlide = preparedSlides[Math.min(currentIndex, total - 1)] || preparedSlides[0];
  const bullets = normalizeBullets(currentSlide?.bullets);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;

  function goPrevious() {
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    setCurrentIndex((value) => Math.min(total - 1, value + 1));
  }

  return (
    <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Presentation className="h-4 w-4" />课程可视化</p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 break-words text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800">
          <span>第 {currentIndex + 1} 页</span>
          <span className="text-sky-300">/</span>
          <span>{total}</span>
        </div>
      </div>

      <div className="max-w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 p-2 shadow-inner sm:p-5">
        <div className="min-h-[320px] rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-4 shadow-sm sm:min-h-[420px] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Slide {currentIndex + 1}</span>
              {isNonEmptyText(currentSlide?.relatedPhase) ? <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{currentSlide.relatedPhase}</span> : null}
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{currentIndex + 1} / {total}</span>
          </div>

          <div className="mt-7 max-w-4xl min-w-0">
            <h3 className="break-words text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">{currentSlide?.title || '课程课件'}</h3>
            {isNonEmptyText(currentSlide?.subtitle) ? <p className="mt-3 break-words text-base font-semibold leading-7 text-sky-800 sm:text-lg">{currentSlide.subtitle}</p> : null}
            {isNonEmptyText(currentSlide?.content) ? <p className="mt-6 break-words text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{currentSlide.content}</p> : null}
          </div>

          {bullets.length > 0 ? (
            <ul className="mt-7 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
              {bullets.map((bullet, index) => (
                <li key={`${bullet}-${index}`} className="flex min-w-0 gap-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-700" />
                  <span className="min-w-0 break-words">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {isNonEmptyText(currentSlide?.speakerNote) ? (
            <div className="mt-7 rounded-2xl border border-sky-100 bg-white/90 p-4 text-sm leading-6 text-sky-900 shadow-sm">
              <p className="font-semibold">AILINES AI 讲稿 / 提示</p>
              <p className="mt-2 break-words">{currentSlide.speakerNote}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button type="button" onClick={goPrevious} disabled={isFirst} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">
          <ChevronLeft className="h-4 w-4" />上一页
        </button>
        <div className="flex flex-wrap justify-center gap-1.5 px-2">
          {preparedSlides.slice(0, 12).map((slide, index) => <button key={`${slide.title}-${index}`} type="button" onClick={() => setCurrentIndex(index)} className={`h-2.5 rounded-full transition ${index === currentIndex ? 'w-8 bg-sky-700' : 'w-2.5 bg-slate-300 hover:bg-sky-300'}`} aria-label={`切换到第 ${index + 1} 页`} />)}
        </div>
        <button type="button" onClick={goNext} disabled={isLast} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white">
          下一页<ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setCurrentIndex(0)} disabled={isFirst} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">
          <RotateCcw className="h-4 w-4" />回到第一张
        </button>
      </div>
    </section>
  );
}

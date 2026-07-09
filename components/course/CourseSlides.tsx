'use client';

import { ChevronLeft, ChevronRight, Presentation } from 'lucide-react';
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
  const currentSlide = preparedSlides[Math.min(currentIndex, preparedSlides.length - 1)] || preparedSlides[0];
  const total = preparedSlides.length || 1;

  function goPrevious() {
    setCurrentIndex((value) => (value <= 0 ? total - 1 : value - 1));
  }

  function goNext() {
    setCurrentIndex((value) => (value >= total - 1 ? 0 : value + 1));
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Presentation className="h-4 w-4" />课程可视化</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800">{currentIndex + 1} / {total}</div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-5 shadow-inner sm:p-8">
        <div className="min-h-[320px] rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm sm:p-8">
          {currentSlide.relatedPhase ? <p className="mb-4 w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{currentSlide.relatedPhase}</p> : null}
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{currentSlide.title}</h3>
          {currentSlide.subtitle ? <p className="mt-3 text-base font-medium text-sky-800">{currentSlide.subtitle}</p> : null}
          <p className="mt-5 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{currentSlide.content}</p>
          {Array.isArray(currentSlide.bullets) && currentSlide.bullets.length > 0 ? (
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              {currentSlide.bullets.map((bullet, index) => <li key={`${bullet}-${index}`} className="rounded-2xl bg-slate-50 p-3">{bullet}</li>)}
            </ul>
          ) : null}
          {currentSlide.speakerNote ? (
            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
              <p className="font-semibold">AILINES AI 讲解稿</p>
              <p className="mt-2">{currentSlide.speakerNote}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={goPrevious} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
          <ChevronLeft className="h-4 w-4" />上一页
        </button>
        <div className="flex justify-center gap-1.5">
          {preparedSlides.slice(0, 12).map((slide, index) => <button key={`${slide.title}-${index}`} type="button" onClick={() => setCurrentIndex(index)} className={`h-2.5 rounded-full transition ${index === currentIndex ? 'w-8 bg-sky-700' : 'w-2.5 bg-slate-300'}`} aria-label={`切换到第 ${index + 1} 页`} />)}
        </div>
        <button type="button" onClick={goNext} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
          下一页<ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

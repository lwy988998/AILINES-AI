'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, HelpCircle, ListChecks, RotateCcw } from 'lucide-react';
import { LearnCompletionButton } from '@/components/LearnCompletionButton';
import type { LearningAnswer } from '@/lib/learning/mockLearningAnswer';

type CompletionProps = {
  goal: string;
  mode: 'lite' | 'deep';
  courseId?: string;
  taskId?: string;
  phaseIndex: number;
  phaseName: string;
  topicIndex: number;
  topic: string;
  progressHref?: string;
};

type LearnInteractiveLessonProps = {
  answer: LearningAnswer;
  completion: CompletionProps;
  nextHref: string;
  planHref: string;
  myCoursesHref?: string;
};

type QuizItem = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

function uniqueOptions(options: string[], fallback: string[]) {
  const merged = [...options, ...fallback]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
  return merged.slice(0, 4).length >= 2 ? merged.slice(0, 4) : fallback.slice(0, 4);
}

function buildQuiz(answer: LearningAnswer): QuizItem[] {
  const stepTitles = answer.lessonSteps.map((step) => step.title).filter(Boolean);
  const concepts = answer.keyConcepts.filter(Boolean);
  const checkpoints = answer.checkpoint.filter(Boolean);
  const mistakes = answer.commonMistakes.filter(Boolean);
  const practice = answer.practice.filter(Boolean);

  const firstStep = stepTitles[0] || '先理解核心概念，再做最小练习';
  const firstConcept = concepts[0] || '核心概念';
  const firstCheckpoint = checkpoints[0] || '能独立完成一个基础练习';

  return [
    {
      question: '学习这节课时，最推荐的第一步是什么？',
      options: uniqueOptions([firstStep, ...stepTitles.slice(1, 4)], ['先理解核心概念', '直接跳到最后答案', '只收藏资料不练习', '忽略检查标准']),
      answerIndex: 0,
      explanation: '微课程的目标是先建立理解，再通过示例、练习和检查标准确认掌握。',
    },
    {
      question: `关于「${firstConcept}」，哪种做法更符合本课学习方式？`,
      options: uniqueOptions([
        `用自己的话解释「${firstConcept}」并完成一个例子`,
        mistakes[0] || '只记住名称，不理解使用场景',
        '只看参考链接，不做练习',
        '跳过例题，直接进入下一课',
      ], ['解释概念并练习', '只背名词', '跳过例题', '不做检查']),
      answerIndex: 0,
      explanation: '真正掌握一个概念，需要能解释、能举例、能在练习里用出来。',
    },
    {
      question: '完成本节课后，哪项最适合作为掌握标准？',
      options: uniqueOptions([firstCheckpoint, ...(practice[0] ? [practice[0].check] : []), mistakes[1] || '不记录错误原因', '只觉得自己看懂了'], ['能完成自检标准', '只看完页面', '没有练习', '不复盘']),
      answerIndex: 0,
      explanation: '完成标准应该是可检查的能力或产出，而不是“看过了”。',
    },
  ];
}

export function LearnInteractiveLesson({ answer, completion, nextHref, planHref, myCoursesHref = '/my-courses' }: LearnInteractiveLessonProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const quiz = useMemo(() => buildQuiz(answer), [answer]);
  const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = quiz.reduce((count, item, index) => count + (selectedAnswers[index] === item.answerIndex ? 1 : 0), 0);

  return (
    <>
      <section id="practice-steps" className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">分步练习</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">跟着做，而不是只看懂</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">勾选状态保存在当前页面；点击“标记本节已完成”后会把本学习点整体进度写入数据库。</p>
          </div>
          <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">{checkedCount} / {answer.lessonSteps.length} 步</span>
        </div>
        <div className="mt-6 space-y-3">
          {answer.lessonSteps.map((step, index) => {
            const checked = Boolean(checkedSteps[index]);
            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => setCheckedSteps((current) => ({ ...current, [index]: !current[index] }))}
                className={`w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 ${checked ? 'border-emerald-200 bg-emerald-50 focus:ring-emerald-100' : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-sky-50 focus:ring-sky-100'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${checked ? 'bg-emerald-600 text-white' : 'bg-white text-sky-700'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.action}</p>
                    <p className="mt-2 rounded-xl bg-white/80 p-3 text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">完成标准：</span>{step.check}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="exercises" className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">练习题</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">用题目把知识变成能力</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {answer.practice.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{index + 1}. {item.title}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700">{item.difficulty}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.task}</p>
              <details className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-700">
                <summary className="cursor-pointer font-semibold text-slate-950">查看提示 / 参考答案</summary>
                <p className="mt-2">{item.check}</p>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section id="quiz" className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">小测验</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">3 道题检查你有没有真正掌握</h2>
          </div>
          <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">得分 {score} / {quiz.length}</span>
        </div>
        <div className="mt-6 space-y-5">
          {quiz.map((item, questionIndex) => {
            const selected = selectedAnswers[questionIndex];
            const answered = selected !== undefined;
            const correct = selected === item.answerIndex;
            return (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-950">{questionIndex + 1}. {item.question}</h3>
                    <div className="mt-4 grid gap-2">
                      {item.options.map((option, optionIndex) => {
                        const isSelected = selected === optionIndex;
                        const isAnswer = item.answerIndex === optionIndex;
                        return (
                          <button
                            key={`${option}-${optionIndex}`}
                            type="button"
                            onClick={() => setSelectedAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-4 ${
                              answered && isAnswer
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 focus:ring-emerald-100'
                                : answered && isSelected && !isAnswer
                                  ? 'border-rose-200 bg-rose-50 text-rose-800 focus:ring-rose-100'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50 focus:ring-sky-100'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </button>
                        );
                      })}
                    </div>
                    {answered ? (
                      <p className={`mt-3 rounded-xl p-3 text-sm leading-6 ${correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                        <span className="font-semibold">{correct ? '答对了。' : '还差一点。'}</span>{item.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {answeredCount > 0 ? (
          <button type="button" onClick={() => setSelectedAnswers({})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
            <RotateCcw className="h-4 w-4" />
            重新作答
          </button>
        ) : null}
      </section>

      <section id="actions" className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-sky-700">底部操作区</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">完成本节课后，继续推进路线</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">建议先完成分步练习和小测验，再标记完成。完成后课程总进度会重新计算。</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={nextHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
                继续下一节
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={planHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                <ListChecks className="h-4 w-4" />
                返回课程大纲
              </Link>
              <Link href={myCoursesHref} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                返回我的课堂
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/80 p-5">
            <LearnCompletionButton {...completion} />
          </div>
        </div>
      </section>
    </>
  );
}

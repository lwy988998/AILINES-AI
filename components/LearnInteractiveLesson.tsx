'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, HelpCircle, ListChecks, RotateCcw, Trophy } from 'lucide-react';
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

function isValidQuizItem(item: unknown): item is QuizItem {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;
  const options = Array.isArray(record.options) ? record.options.map((option) => String(option || '').trim()).filter(Boolean) : [];
  const answerIndex = typeof record.answerIndex === 'number' ? record.answerIndex : -1;
  return typeof record.question === 'string' && record.question.trim().length > 0
    && options.length === 4
    && Number.isInteger(answerIndex)
    && answerIndex >= 0
    && answerIndex < options.length
    && typeof record.explanation === 'string'
    && record.explanation.trim().length > 0;
}

function buildQuiz(answer: LearningAnswer): QuizItem[] {
  return Array.isArray(answer.quiz) ? answer.quiz.filter(isValidQuizItem).slice(0, 5) : [];
}

export function LearnInteractiveLesson({ answer, completion, nextHref, planHref, myCoursesHref = '/my-courses' }: LearnInteractiveLessonProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const quiz = useMemo(() => buildQuiz(answer), [answer]);
  const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = quiz.reduce((count, item, index) => count + (selectedAnswers[index] === item.answerIndex ? 1 : 0), 0);
  const quizComplete = quiz.length > 0 && answeredCount === quiz.length;
  const quizPassed = quiz.length > 0 && score / quiz.length >= 0.7;

  return (
    <>
      <section id="practice-steps" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">分步练习</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">跟着做，而不是只看懂</h2>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">勾选状态保存在当前页面；点击“标记本节已完成”后会同步本学习点整体进度。</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${checkedCount === answer.lessonSteps.length ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-800'}`}>{checkedCount} / {answer.lessonSteps.length} 步已完成</span>
        </div>
        <div className="stagger-fade mt-6 space-y-3">
          {answer.lessonSteps.map((step, index) => {
            const checked = Boolean(checkedSteps[index]);
            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => setCheckedSteps((current) => ({ ...current, [index]: !current[index] }))}
                className={`w-full min-w-0 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 ${checked ? 'border-emerald-200 bg-emerald-50 focus:ring-emerald-100' : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-sky-50 focus:ring-sky-100'}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${checked ? 'bg-emerald-600 text-white' : 'bg-white text-sky-700'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="break-words font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">{step.action}</p>
                    <p className="mt-2 break-words rounded-xl bg-white/80 p-3 text-sm leading-6 text-slate-700"><span className="break-words font-semibold text-slate-950">完成标准：</span>{step.check}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="exercises" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">练习题</p>
            <h2 className="break-words text-2xl font-semibold tracking-tight text-slate-950">用题目把知识变成能力</h2>
          </div>
        </div>
        <div className="stagger-fade grid gap-4 md:grid-cols-2">
          {answer.practice.map((item, index) => (
            <article key={`${item.title}-${index}`} className="interactive-card min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-semibold text-slate-950">{index + 1}. {item.title}</h3>
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

      <section id="quiz" className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
        {quiz.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 md:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-700">小测验</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">AI 生成题检查你有没有真正掌握</h2>
              </div>
              <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">得分 {score} / {quiz.length}</span>
            </div>
            <div className="stagger-fade mt-6 space-y-5">
              {quiz.map((item, questionIndex) => {
                const selected = selectedAnswers[questionIndex];
                const answered = selected !== undefined;
                const correct = selected === item.answerIndex;
                return (
                  <article key={item.question} className="interactive-card min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
                      <div className="flex-1">
                        <h3 className="break-words font-semibold text-slate-950">{questionIndex + 1}. {item.question}</h3>
                        <div className="mt-4 grid gap-2">
                          {item.options.map((option, optionIndex) => {
                            const isSelected = selected === optionIndex;
                            const isAnswer = item.answerIndex === optionIndex;
                            return (
                              <button
                                key={`${option}-${optionIndex}`}
                                type="button"
                                onClick={() => setSelectedAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                                className={`min-w-0 rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-4 ${
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
                          <p className={`mt-3 rounded-xl p-3 text-sm leading-6 animate-soft-pop ${correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                            <span className="font-semibold">{correct ? '答对了。' : '还差一点。'}</span>{item.explanation}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {quizComplete ? (
              <div className={`mt-4 rounded-2xl border p-4 text-sm leading-6 animate-soft-pop ${quizPassed ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-900'}`}>
                <p className="font-semibold">{quizPassed ? '小测通过，可以继续下一节。' : '得分偏低，建议先复习本节再继续。'}</p>
                <p className="mt-1">当前得分 {score}/{quiz.length}。{quizPassed ? '如果分步练习也完成了，就标记本节已完成。' : '可以回到课程讲解和示例，再重新作答。'}</p>
              </div>
            ) : null}
            {answeredCount > 0 ? (
              <button type="button" onClick={() => setSelectedAnswers({})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 interactive-button transition hover:text-sky-900">
                <RotateCcw className="h-4 w-4" />
                重新作答
              </button>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">小测验暂未生成完成</p>
                <p className="mt-1">没有使用模板题补齐。请点击上方“换一版讲解”重新生成本课测验。</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="actions" className="min-w-0 rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-4 shadow-sm shadow-sky-900/5 sm:p-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sky-700">底部操作区</p>
            <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">完成本节课后，继续推进路线</h2>
            <p className="mt-3 break-words text-sm leading-6 text-slate-600">建议先完成分步练习和小测验，再标记完成。完成后课程总进度会重新计算。</p>
            {lessonCompleted ? (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 animate-soft-pop">
                <p className="flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4" />本节已完成</p>
                <p className="mt-1">学习进度已立即更新。下一步建议继续下一节，或回到课程大纲查看整体进度。</p>
              </div>
            ) : null}
            <div className="mobile-button-stack mt-5 flex flex-col gap-3 md:flex-row md:flex-wrap">
              <Link href={nextHref} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition focus:outline-none focus:ring-4 ${lessonCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200' : 'bg-sky-700 text-white hover:bg-sky-800 focus:ring-sky-200'}`}>
                继续下一节
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={planHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 interactive-button transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                <ListChecks className="h-4 w-4" />
                返回课程大纲
              </Link>
              <Link href={myCoursesHref} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 interactive-button transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100">
                返回我的课堂
              </Link>
            </div>
          </div>
          <div className="min-w-0 rounded-3xl border border-white/80 bg-white/80 p-4 sm:p-5">
            <LearnCompletionButton {...completion} onCompleted={() => setLessonCompleted(true)} />
          </div>
        </div>
      </section>
    </>
  );
}

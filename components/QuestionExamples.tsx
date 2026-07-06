import Link from 'next/link';
import { exampleQuestions } from '@/lib/mockAnswers';

type QuestionExamplesProps = {
  goal: string;
};

export function QuestionExamples({ goal }: QuestionExamplesProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5 sm:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-sky-700">示例问题</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">不知道怎么问？可以先点一个</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {exampleQuestions.map((question) => (
          <Link
            key={question}
            href={`/ask?goal=${encodeURIComponent(goal)}&question=${encodeURIComponent(question)}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold leading-6 text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            {question}
          </Link>
        ))}
      </div>
    </section>
  );
}

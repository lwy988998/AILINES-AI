const faqs = [
  {
    question: '会员可以生成多少条路线？',
    answer: 'MVP 规划中会员支持无限生成，正式上线后可能结合风控和成本限制。',
  },
  {
    question: '路线包和会员有什么区别？',
    answer: '会员偏长期订阅，路线包偏单个领域的深度内容。',
  },
  {
    question: '现在可以支付吗？',
    answer: '当前页面为静态演示，支付会在后续任务中接入。',
  },
  {
    question: '免费用户可以使用问答吗？',
    answer: '可以，免费用户规划为每日 5 次轻量问答。',
  },
];

export function MembershipFAQ() {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">FAQ</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">常见问题</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

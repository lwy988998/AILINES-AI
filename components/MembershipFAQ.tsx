const faqs = [
  {
    question: '会员可以生成多少门课程？',
    answer: '不同方案拥有不同的每日课程生成额度。你可以在权益对比中查看当前可用次数。',
  },
  {
    question: 'Pro 和 Max 适合谁？',
    answer: 'Pro 适合持续学习和多课程管理；Max 适合高频学习、更多生图和更高额度需求。',
  },
  {
    question: '如何开通 Pro 或 Max？',
    answer: '请联系管理员开通。开通后登录账号即可同步对应权益。',
  },
  {
    question: '免费用户可以使用问答吗？',
    answer: '可以。Free 方案可使用课程生成、资料搜索和学习问答额度。',
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

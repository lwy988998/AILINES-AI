const benefitRows = [
  ['每日课程生成', '3 次', '30 次', '200 次'],
  ['每日学习卡片生成', '3 次', '50 次', '300 次'],
  ['每日生图', '1 次', '20 次', '100 次'],
  ['历史课堂', '支持', '支持', '支持'],
  ['课程进度保存', '支持', '支持', '支持'],
  ['深度 AILINES AI 规划', 'Pro 提示', '支持', '支持'],
  ['课程课件和思维导图', '升级提示', '支持', '支持'],
  ['浮动 AILINES AI 助手', '升级提示', '支持', '支持'],
];

export function BenefitsTable() {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">权益对比</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Free / Pro / Max 权限与额度</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead className="bg-sky-50 text-sky-900">
            <tr>
              {['权益', 'Free', 'Pro', 'Max'].map((header) => (
                <th key={header} className="border-b border-sky-100 px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {benefitRows.map((row) => (
              <tr key={row[0]} className="bg-white">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}-${cell}`} className={`px-4 py-4 ${index === 0 ? 'font-semibold text-slate-950' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

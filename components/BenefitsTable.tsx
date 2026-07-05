const benefitRows = [
  ['学习路线生成', '基础版', '无限', '单条精品'],
  ['课程结构', '概要', '完整', '完整'],
  ['开源资源', 'Top 5', '完整列表', '精选'],
  ['项目实战路径', '1 个项目', '完整项目链', '完整指导'],
  ['轻量问答', '5 次/天', '无限', '不包含'],
  ['进度追踪', '基础', '完整', '基础'],
  ['导出 PDF', '不支持', '支持', '支持'],
];

export function BenefitsTable() {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">权益对比</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">选择适合当前阶段的方案</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead className="bg-sky-50 text-sky-900">
            <tr>
              {['权益', '免费版', '会员版', '路线包'].map((header) => (
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
                  <td key={`${row[0]}-${cell}`} className={`px-4 py-4 ${index === 0 ? 'font-semibold text-slate-950' : ''}`}>
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

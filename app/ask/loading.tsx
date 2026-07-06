export default function AskLoading() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
          <p className="text-sm font-semibold text-sky-700">AI 正在思考...</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">正在为你生成步骤化解答。</h1>
        </section>
      </div>
    </main>
  );
}

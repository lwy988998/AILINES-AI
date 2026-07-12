import { RegisterForm } from '@/components/auth/RegisterForm';
import { SiteHeader } from '@/components/site-header';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.9),rgba(248,251,255,0.98)_44%,rgba(255,255,255,1))]">
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-sky-700">AILINES AI 账号</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">注册 AILINES AI</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">只需要邮箱和密码。不会影响未登录的匿名学习流程。</p>
        </div>
        <RegisterForm />
      </section>
    </main>
  );
}

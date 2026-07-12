import { LoginForm } from '@/components/auth/LoginForm';
import { SiteHeader } from '@/components/site-header';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.9),rgba(248,251,255,0.98)_44%,rgba(255,255,255,1))]">
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-sky-700">AILINES AI 账号</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">登录 AILINES AI</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">登录后会自动绑定当前浏览器里的历史课堂和学习进度。</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}

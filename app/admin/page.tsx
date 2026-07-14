import Link from 'next/link';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { SiteHeader } from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { isAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  const isAdmin = isAdminUser(user);

  if (!user) {
    return <main className="min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center"><p className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">需要登录</p><h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">请先登录管理员账号</h1><p className="mt-3 text-slate-600">管理员后台仅对服务端白名单中的登录用户开放。</p><Link href="/login" className="mt-8 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">去登录</Link></section></main>;
  }

  if (!isAdmin) {
    return <main className="min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center"><p className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">无权限</p><h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">你没有访问管理员后台的权限</h1><p className="mt-3 text-slate-600">请确认当前账号已加入服务器端 ADMIN_EMAILS 白名单。</p><Link href="/" className="mt-8 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100">返回首页</Link></section></main>;
  }

  return <main className="min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">管理员后台</h1><p className="mt-3 max-w-2xl text-slate-600">管理 AILINES AI 用户、课程与会员状态。页面不会展示 API Key、token、密码哈希或环境变量内容。</p></div><Link href="/" className="inline-flex w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100">返回首页</Link></div><AdminDashboardClient /></section></main>;
}

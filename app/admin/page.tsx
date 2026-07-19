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
    return <main className="learn-app-page min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24"><p className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">需要登录</p><h1 className="mt-5 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">请先登录管理员账号</h1><p className="mt-3 break-words text-slate-600">管理员后台仅对已授权的管理员账号开放。</p><Link href="/login" className="mt-8 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">去登录</Link></section></main>;
  }

  if (!isAdmin) {
    return <main className="learn-app-page min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24"><p className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">无权限</p><h1 className="mt-5 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">你没有访问管理员后台的权限</h1><p className="mt-3 break-words text-slate-600">请确认当前账号已获得管理员访问权限。</p><Link href="/" className="mt-8 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100">返回首页</Link></section></main>;
  }

  return <main className="learn-app-page min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin</p><h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">管理员后台</h1><p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base">管理用户、课程与会员状态。页面仅展示必要信息。</p></div><Link href="/" className="inline-flex w-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100">返回首页</Link></div><AdminDashboardClient /></section></main>;
}

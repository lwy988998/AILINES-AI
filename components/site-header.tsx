import Link from 'next/link';
import { Menu } from 'lucide-react';
import { BackHomeButton } from './back-home-button';
import { CourseHistoryButton } from './course/CourseHistoryButton';
import { AuthStatus } from './auth/AuthStatus';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { isAdminUser } from '@/lib/admin';

const navItems = [
  { label: '会员', href: '/membership' },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = isAdminUser(user);
  const navContent = (
    <>
      {user ? (
        <Link
          href="/my-courses"
          className="rounded-md px-2.5 py-2 transition hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          我的课堂
        </Link>
      ) : null}
      {isAdmin ? (
        <Link
          href="/admin"
          className="rounded-md px-2.5 py-2 transition hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          管理员后台
        </Link>
      ) : null}
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-md px-2.5 py-2 transition hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          {item.label}
        </Link>
      ))}
      <AuthStatus user={user} />
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-13 w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:min-h-16 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BackHomeButton />
          <Link href="/" className="shrink-0 text-base font-semibold tracking-tight text-sky-900 md:text-lg">
            AILINES AI
          </Link>
          <CourseHistoryButton />
        </div>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-2 text-sm font-medium text-slate-600 md:flex lg:gap-4">
          {navContent}
        </nav>
        <details className="group relative md:hidden">
          <summary className="list-none rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm marker:hidden focus:outline-none focus:ring-2 focus:ring-sky-300 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5"><Menu className="h-4 w-4" />菜单</span>
          </summary>
          <nav className="absolute right-0 top-full mt-2 flex w-[min(18rem,calc(100vw-1.5rem))] flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700 shadow-xl shadow-slate-900/10">
            {navContent}
          </nav>
        </details>
      </div>
    </header>
  );
}

import Link from 'next/link';
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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <BackHomeButton />
          <Link href="/" className="shrink-0 text-base font-semibold tracking-tight text-sky-900 sm:text-lg">
            AILINES AI
          </Link>
          <CourseHistoryButton />
        </div>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 text-sm font-medium text-slate-600 sm:gap-2 lg:flex-none lg:flex-nowrap lg:gap-4">
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
        </nav>
      </div>
    </header>
  );
}

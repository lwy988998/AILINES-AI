import Link from 'next/link';
import { BackHomeButton } from './back-home-button';
import { CourseHistoryButton } from './course/CourseHistoryButton';
import { AuthStatus } from './auth/AuthStatus';
import { getCurrentUser } from '@/lib/auth/currentUser';

const navItems = [
  { label: '我的课堂', href: '/my-courses' },
  { label: '会员', href: '/membership' },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BackHomeButton />
          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-sky-900">
            AILINES AI
          </Link>
          <CourseHistoryButton />
        </div>
        <nav className="flex shrink-0 items-center gap-1 text-sm font-medium text-slate-600 sm:gap-4">
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

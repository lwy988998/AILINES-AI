'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BackHomeButton() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
    >
      ← 返回首页
    </Link>
  );
}

import { MyCoursesClient } from '@/components/course/MyCoursesClient';
import { SiteHeader } from '@/components/site-header';

export const dynamic = 'force-dynamic';

export default function MyCoursesPage() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <MyCoursesClient />
    </main>
  );
}

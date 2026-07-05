import { RoutesClient } from '@/components/RoutesClient';
import { SiteHeader } from '@/components/site-header';

export default function RoutesPage() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <RoutesClient />
    </main>
  );
}

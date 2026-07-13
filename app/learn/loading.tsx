import { SiteHeader } from '@/components/site-header';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';

export default function LearnLoading() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AilinesGeneratingState type="learn" />
      </div>
    </main>
  );
}

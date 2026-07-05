import { BenefitsTable } from '@/components/BenefitsTable';
import { MembershipFAQ } from '@/components/MembershipFAQ';
import { MembershipHero } from '@/components/MembershipHero';
import { PricingCards } from '@/components/PricingCards';
import { SiteHeader } from '@/components/site-header';

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <MembershipHero />
        <PricingCards />
        <BenefitsTable />
        <MembershipFAQ />
      </div>
    </main>
  );
}

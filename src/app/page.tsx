// src/app/page.tsx
import {
  Navbar,
  Hero,
  ContentRails,
  HowItWorks,
  Payouts,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing';
import { getLandingData } from '@/lib/landing/data';
import { TabBar } from '@/components/app/TabBar';

// Rendered per request from a 5-minute cache (see getLandingData), so the
// page always shows live content without hitting the DB on every visit.
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const data = await getLandingData();

  return (
    <div className="min-h-screen bg-[#070B14] font-sans antialiased pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
      <Navbar />
      <main>
        <Hero data={data} />
        <ContentRails videos={data.videos} games={data.games} surveys={data.surveys} />
        <HowItWorks />
        <Payouts stats={data.stats} payouts={data.payouts} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      {/* Same tab bar as the app, guest variant (phones only) */}
      <TabBar variant="guest" />
    </div>
  );
}

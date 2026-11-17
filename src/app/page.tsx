// src/app/page.tsx

import {
  Navbar,
  Hero,
  StatsBar,
  WaysToEarn,
  HowItWorks,
  FAQ,
  FinalCTA,
  Footer,
  LiveWithdrawalFeed,
  LiveWithdrawalLeaderboard,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-text-primary">
      <Navbar />
      <Hero />
      <StatsBar />
      <WaysToEarn />
      <HowItWorks />

      {/* Social proof: real withdrawals */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-2">
              Real people. Real payouts.
            </p>
            <h2 className="text-3xl font-black text-navy">
              Recent <span className="text-gold">withdrawals</span>
            </h2>
            <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto">
              Boostly members being paid to their mobile money.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <LiveWithdrawalFeed />
            <LiveWithdrawalLeaderboard />
          </div>
        </div>
      </section>

      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

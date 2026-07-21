// src/app/page.tsx

import {
  Navbar,
  Hero,
  StatsBar,
  HowItWorks,
  WhyChoose,
  Plans,
  MissionVision,
  Testimonials,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing';
import { LiveWithdrawalFeed } from '@/components/landing/LiveWithdrawalFeed';
import { LiveWithdrawalLeaderboard } from '@/components/landing/LiveWithdrawalLeaderboard';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-text-primary">
      <Navbar />
      <Hero />
      {/* Stats Bar with Live Data */}
      <StatsBar />
      {/* How It Works */}
      <HowItWorks />
      {/* Why Choose */}
      <WhyChoose />
      {/* Plans */}
      <Plans />
      {/* Social Proof Section - Live Withdrawals & Leaderboard */}
      <section className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-2">
              Real People. Real Rewards.
            </p>
            <h2 className="text-3xl font-black text-navy">
              See Who&apos;s <span className="text-gold">Withdrawing</span> Right Now
            </h2>
            <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto">
              Watch real-time withdrawals from Boostly users around the world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Live Withdrawal Feed */}
            <LiveWithdrawalFeed />

            {/* Leaderboard */}
            <LiveWithdrawalLeaderboard />
          </div>
        </div>
      </section>
      {/* Mission & Vision */}
      <MissionVision />
      {/* Testimonials */}
      <Testimonials />
      {/* FAQ */}
      <FAQ />
      {/* Final CTA */}
      <FinalCTA />
      {/* Footer */}
      <Footer />
    </div>
  );
}

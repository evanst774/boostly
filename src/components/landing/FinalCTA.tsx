// src/components/landing/FinalCTA.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="bg-navy py-14">
      <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-black text-white mb-1">
            Start earning today. It&apos;s free.
          </h3>
          <p className="text-white/60 text-sm">
            Complete simple tasks and get paid to your mobile money every day at
            3:00 PM.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3.5 rounded-full transition whitespace-nowrap shadow-gold"
        >
          Start earning free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

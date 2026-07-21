// src/components/landing/Hero.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Play, Bell } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-navy-gradient relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-light text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> #1 REWARDS
            &amp; EARNING PLATFORM
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Earn Rewards.
            <br />
            Get Paid. <span className="text-gold">Every Day.</span>
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-md">
            Boostly rewards you for doing what you love. Watch videos, play
            games, complete offers and more. Real rewards. Real payouts. Real
            people.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3.5 rounded-full transition shadow-gold"
            >
              Start Earning Now <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold px-6 py-3.5 rounded-full hover:bg-white/10 transition">
              <Play className="w-4 h-4 fill-white" /> How It Works
            </button>
          </div>
          <div className="flex flex-wrap gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-success">✓</span> 100% Secure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success">✓</span> Instant Payouts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success">✓</span> Trusted by 500K+ Users
            </span>
          </div>
        </div>

        {/* Phone Mockup */}
        <div className="relative flex justify-center animate-float">
          <div className="absolute w-72 h-72 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative w-[280px] bg-white rounded-[2.5rem] shadow-2xl p-3 border-8 border-navy-lighter">
            <div className="bg-bg rounded-[1.8rem] overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-text-secondary">
                      Hello, John! 👋
                    </p>
                    <p className="text-[10px] text-text-muted">Welcome back</p>
                  </div>
                  <Bell className="w-4 h-4 text-text-muted" />
                </div>
                <div className="bg-blue-gradient rounded-2xl p-4 text-white mb-3">
                  <p className="text-[10px] opacity-75">Total Balance</p>
                  <p className="text-2xl font-black">$124.50</p>
                  <button className="mt-2 bg-white text-primary text-[10px] font-bold px-3 py-1.5 rounded-full">
                    Withdraw
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    ['Videos', 'bg-primary'],
                    ['Games', 'bg-success'],
                    ['Ads', 'bg-warning'],
                    ['Bonus', 'bg-pink'],
                  ].map(([label, color]) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${color} opacity-90`}
                      />
                      <span className="text-[8px] text-text-secondary">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-gold-light border border-gold/30 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-navy mb-1">
                    Daily Check-in
                  </p>
                  <div className="flex gap-1">
                    {[10, 30, 40, 60, 75, 100, 150].map((v, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-6 rounded ${i < 5 ? 'bg-gold' : 'bg-border'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div
            className="absolute -top-4 -right-2 w-14 h-14 rounded-full bg-gold flex items-center justify-center text-2xl shadow-gold animate-float"
            style={{ animationDelay: '.5s' }}
          >
            💰
          </div>
          <div
            className="absolute bottom-8 -left-6 w-12 h-12 rounded-2xl bg-primary/80 flex items-center justify-center text-xl shadow-blue animate-float"
            style={{ animationDelay: '1s' }}
          >
            🎬
          </div>
          <div
            className="absolute top-1/2 -right-8 w-12 h-12 rounded-2xl bg-purple/80 flex items-center justify-center text-xl shadow-lg animate-float"
            style={{ animationDelay: '1.5s' }}
          >
            🎮
          </div>
        </div>
      </div>
    </section>
  );
}

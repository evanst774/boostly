// src/components/auth/AuthShell.tsx
'use client';

import Link from 'next/link';
import { Gift, PlayCircle, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// Colors are hardcoded on purpose (not pulled from tailwind.config theme
// extensions) so this renders correctly regardless of whether the project's
// custom Tailwind theme is compiling. See register page notes.

const RewardChip = ({
  icon,
  label,
  tone,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'gold' | 'primary' | 'success';
  style?: React.CSSProperties;
}) => {
  const toneClasses = {
    gold: 'bg-[#FBBF24]/15 border-[#FBBF24]/30 text-[#FBBF24]',
    primary: 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#93C5FD]',
    success: 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#4ADE80]',
  }[tone];

  return (
    <div
      className={cn(
        'absolute flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md shadow-lg',
        toneClasses,
      )}
      style={{ ...style, animation: 'boostlyFloat 3s ease-in-out infinite' }}
    >
      {icon}
      <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
    </div>
  );
};

interface AuthShellProps {
  children: React.ReactNode;
  /** e.g. "Already have an account?" or "New to Boostly?" */
  bottomPrompt: string;
  bottomLinkText: string;
  bottomLinkHref: string;
}

export default function AuthShell({
  children,
  bottomPrompt,
  bottomLinkText,
  bottomLinkHref,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-0 lg:p-6">
      <style>{`
        @keyframes boostlyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="w-full lg:max-w-[1100px] grid grid-cols-1 lg:grid-cols-[420px_1fr] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-xl overflow-hidden bg-[#1E293B]/30">
        {/* ═══ LEFT PANEL (brand) ═══ */}
        <div
          className="hidden lg:flex flex-col relative overflow-hidden p-10"
          style={{
            background:
              'linear-gradient(160deg, #0F172A 0%, #1E293B 55%, #334155 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(37,99,235,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 flex items-center gap-3 mb-2">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] via-[#FBBF24] to-[#8B5CF6] rounded-lg blur-md opacity-50" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#FBBF24] flex items-center justify-center">
                <span className="text-base font-black text-white">B</span>
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Boostly
            </span>
          </div>
          <p className="relative z-10 text-sm text-white/50 mb-5">
            Watch. Refer. Earn.
          </p>
          <div className="relative z-10 w-9 h-0.5 bg-[#FBBF24] mb-7" />

          <h1 className="relative z-10 text-[28px] leading-[1.25] font-bold text-white mb-3.5">
            Built to reward{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              every minute
            </span>{' '}
            you spend here
          </h1>
          <p className="relative z-10 text-sm text-white/50 leading-relaxed max-w-[280px] mb-9">
            Join thousands earning daily points, referral bonuses, and cash
            payouts on Boostly.
          </p>

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#2563EB]/35 bg-[#2563EB]/10 flex items-center justify-center text-[#93C5FD]">
                <PlayCircle className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Watch &amp; Earn
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Get rewarded in points for every video you watch
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#FBBF24]/35 bg-[#FBBF24]/10 flex items-center justify-center text-[#FBBF24]">
                <Users className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Refer Friends
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Earn a welcome bonus for every friend who joins
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 flex items-center justify-center text-[#C4B5FD]">
                <Wallet className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Instant Payouts
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Cash out to fiat or crypto whenever you like
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-1 min-h-[140px] mt-8">
            <RewardChip
              icon={<Gift className="w-3.5 h-3.5" />}
              label="+500 referral bonus"
              tone="gold"
              style={{ top: 8, left: 8, animationDelay: '0s' }}
            />
            <RewardChip
              icon={<PlayCircle className="w-3.5 h-3.5" />}
              label="+50 pts watched"
              tone="primary"
              style={{ top: 64, left: 96, animationDelay: '.8s' }}
            />
            <RewardChip
              icon={<Wallet className="w-3.5 h-3.5" />}
              label="$24.80 available"
              tone="success"
              style={{ top: 128, left: 16, animationDelay: '1.6s' }}
            />
          </div>

          <div className="relative z-10 mt-auto pt-6 text-sm text-white/50">
            {bottomPrompt}{' '}
            <Link
              href={bottomLinkHref}
              className="text-[#FBBF24] font-semibold hover:text-[#F59E0B] transition-colors"
            >
              {bottomLinkText}
            </Link>
          </div>
        </div>

        {/* ═══ RIGHT PANEL (page content slot) ═══ */}
        <div className="flex flex-col bg-[#0F172A] px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-11 max-h-screen overflow-y-auto">
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#FBBF24] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-white">B</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Boostly
            </span>
          </div>

          {children}

          <p className="text-center lg:hidden text-xs text-white/30 mt-6">
            {bottomPrompt}{' '}
            <Link
              href={bottomLinkHref}
              className="text-white/60 hover:text-white font-semibold transition-colors"
            >
              {bottomLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
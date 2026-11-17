// src/components/landing/WaysToEarn.tsx
import Link from 'next/link';
import { ArrowRight, PlayCircle, Gamepad2, ClipboardCheck } from 'lucide-react';

const WAYS = [
  {
    icon: PlayCircle,
    title: 'Sponsored videos',
    desc: 'Watch short videos from brands. Every video you finish earns you money.',
    href: '/earn/videos',
    color: 'bg-primary',
  },
  {
    icon: Gamepad2,
    title: 'Games',
    desc: 'Play quick, fun games and earn a reward for each game you finish.',
    href: '/earn/games',
    color: 'bg-emerald-500',
  },
  {
    icon: ClipboardCheck,
    title: 'Surveys',
    desc: 'Share your opinion on short surveys. Answer honestly to get paid.',
    href: '/earn/surveys',
    color: 'bg-amber-500',
  },
];

export function WaysToEarn() {
  return (
    <section id="ways-to-earn" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-gold text-xs font-bold tracking-widest uppercase mb-2">
            Ways to earn
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-navy mb-3">
            Three simple ways to <span className="text-gold">get paid</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            New tasks are ready for you every day. Do them from your phone or
            computer.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {WAYS.map(({ icon: Icon, title, desc, href, color }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <span
                className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6 text-white" />
              </span>
              <h3 className="text-lg font-bold text-navy mb-1">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {desc}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                Start now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

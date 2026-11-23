// src/components/app/ProductTour.tsx
//
// First-visit guided tour. Highlights real elements marked with
// data-tour="<id>" (the visible one wins, so phone tab bar and desktop
// sidebar can share an id). Shown once per device; replay with
// startProductTour().
'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';

const DONE_KEY = 'boostly:tour-v1-done';
const START_EVENT = 'boostly:start-tour';

interface Step {
  target: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: 'balance',
    title: 'Your balance',
    body: `Every task you finish adds RWF here. Tap Withdraw to send it to your MTN or Airtel number. Payouts go out every day at ${PAYOUT_TIME_LABEL}.`,
  },
  {
    target: 'tasks',
    title: "Today's tasks",
    body: 'Your plan decides how many videos, games and surveys pay each day. Tap a task to start.',
  },
  { target: 'nav-earn', title: 'Earn', body: 'All sponsored videos, games and surveys live here.' },
  { target: 'nav-wallet', title: 'Wallet', body: 'See your balance, withdrawals and every reward you earned.' },
  {
    target: 'nav-plans',
    title: 'Plans',
    body: 'Lower plans give more tasks a day; higher plans give fewer tasks that pay more each. Each plan shows its daily maximum and how often you can withdraw.',
  },
  { target: 'nav-me', title: 'Me', body: 'Invite friends, manage notifications, security and your account.' },
];

/** Replay the tour (e.g. from the Me screen). */
export function startProductTour() {
  try {
    localStorage.removeItem(DONE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(START_EVENT));
}

function visibleTarget(id: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
  return all.find((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden') ?? null;
}

export function ProductTour({ autoStart = true }: { autoStart?: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Steps whose target isn't on screen (e.g. a hidden menu) are skipped.
  const steps = STEPS;

  const finish = useCallback(() => {
    setIndex(null);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Start once the first target exists (the dashboard loads its data first).
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const begin = () => {
      let tries = 0;
      timer = setInterval(() => {
        tries += 1;
        if (visibleTarget(steps[0].target)) {
          clearInterval(timer);
          setIndex(0);
        } else if (tries > 40) {
          clearInterval(timer);
        }
      }, 250);
    };
    const onStart = () => begin();
    window.addEventListener(START_EVENT, onStart);
    let done = false;
    try {
      done = localStorage.getItem(DONE_KEY) === '1';
    } catch {
      done = true;
    }
    if (autoStart && !done) begin();
    return () => {
      window.removeEventListener(START_EVENT, onStart);
      if (timer) clearInterval(timer);
    };
  }, [autoStart, steps]);

  // Find the next step that has something to point at.
  const go = useCallback(
    (from: number, dir: 1 | -1) => {
      let i = from;
      while (i >= 0 && i < steps.length) {
        if (visibleTarget(steps[i].target)) return setIndex(i);
        i += dir;
      }
      if (dir === 1) finish();
    },
    [steps, finish],
  );

  useLayoutEffect(() => {
    if (index === null) return;
    const el = visibleTarget(steps[index].target);
    if (!el) return go(index + 1, 1);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const t = setTimeout(update, 350);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [index, steps, go]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') go(index + 1, 1);
      if (e.key === 'ArrowLeft') go(index - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, finish, go]);

  if (index === null || !rect) return null;

  const step = steps[index];
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 32);
  const below = rect.bottom + 16 + 190 < vh;
  const top = below ? rect.bottom + pad + 10 : Math.max(16, rect.top - pad - 10 - 190);
  const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16);
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Spotlight: a transparent box with a huge shadow dims everything else */}
      <div
        className="pointer-events-none fixed rounded-2xl transition-all duration-300"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 2px #FBBF24, 0 0 0 9999px rgba(2,6,23,0.72)',
        }}
      />
      {/* Clicks outside the card do nothing (no accidental skipping) */}
      <div className="absolute inset-0" />

      <div
        className="keep-light fixed rounded-2xl bg-white p-4 text-[#0F172A] shadow-2xl transition-all duration-300"
        style={{ top, left, width: cardW }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold text-[#2563EB]">
            {index + 1} of {steps.length}
          </p>
          <button type="button" onClick={finish} aria-label="Close tour" className="-mr-1 -mt-1 p-1 text-[#94A3B8] hover:text-[#0F172A]">
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-base font-bold">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#475569]">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="text-sm font-medium text-[#64748B] hover:text-[#0F172A]">
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(index - 1, -1)}
                className="rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-sm font-semibold"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : go(index + 1, 1))}
              className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8]"
            >
              {isLast ? 'Start earning' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

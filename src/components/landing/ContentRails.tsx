// src/components/landing/ContentRails.tsx
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Gamepad2,
  Play,
} from 'lucide-react';
import type {
  ShowcaseGame,
  ShowcaseSurvey,
  ShowcaseVideo,
} from '@/lib/landing/data';
import { cn } from '@/lib/utils';
import { useFormatNumber, useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { landing } from '@/lib/i18n/messages/landing';

/** "1,000 RWF" in the current language. */
function useRwf() {
  const tc = useT(common);
  const fmt = useFormatNumber();
  return (n: number) => tc('rwf', { amount: fmt(Math.round(n)) });
}

// Deterministic poster colours per category, used when there is no image.
const TONES = [
  'from-[#1E3A8A] to-[#2563EB]',
  'from-[#134E4A] to-[#0D9488]',
  'from-[#7C2D12] to-[#EA580C]',
  'from-[#4C1D95] to-[#7C3AED]',
  'from-[#831843] to-[#DB2777]',
  'from-[#14532D] to-[#16A34A]',
];
function tone(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

const pretty = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function formatDuration(sec: number | null) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Remote image with a designed fallback when missing or broken. */
function Poster({
  src,
  alt,
  fallbackKey,
  fallback,
}: {
  src: string | null;
  alt: string;
  fallbackKey: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br flex items-center justify-center',
          tone(fallbackKey),
        )}
      >
        {fallback}
      </div>
    );
  }
  return (
    // Admin-uploaded thumbnails can live on any host, so next/image's
    // remotePatterns allow-list doesn't fit here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
    />
  );
}

function Rail({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT(landing);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-end justify-between gap-4 mb-4">
        <div>
          <h3 className="font-rebond-bold text-xl sm:text-2xl text-white tracking-tight">{title}</h3>
          <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href} className="hidden sm:inline text-sm font-semibold text-white/70 hover:text-white mr-2">
            {t('railStart')}
          </Link>
          <button
            type="button"
            aria-label={t('scrollLeft', { title })}
            onClick={() => scroll(-1)}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label={t('scrollRight', { title })}
            onClick={() => scroll(1)}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 hover:bg-white/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-4 sm:px-6 xl:px-[max(1.5rem,calc((100vw_-_80rem)/2_+_1.5rem))] scroll-pl-4 sm:scroll-pl-6 xl:scroll-pl-[max(1.5rem,calc((100vw_-_80rem)/2_+_1.5rem))] pb-2"
        >
          {children}
        </div>
        {/* edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#070B14] to-transparent" />
      </div>
    </div>
  );
}

function VideoCard({ v }: { v: ShowcaseVideo }) {
  const t = useT(landing);
  const rwf = useRwf();
  const d = formatDuration(v.duration);
  return (
    <Link
      href="/register"
      className="group snap-start shrink-0 w-[68vw] xs:w-[240px] sm:w-[280px]"
      aria-label={t('videoAria', { title: v.title, amount: rwf(v.reward) })}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <Poster
          src={v.thumbnailUrl}
          alt=""
          fallbackKey={v.category}
          fallback={<Play className="h-10 w-10 text-white/80" fill="currentColor" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold text-[#111827]">
          +{rwf(v.reward)}
        </span>
        {d && (
          <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
            {d}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white group-hover:text-gold transition-colors">
        {v.title}
      </p>
      <p className="text-xs text-white/45">
        {v.sponsor ? t('sponsoredBy', { sponsor: v.sponsor }) : pretty(v.category)}
      </p>
    </Link>
  );
}

function GameCard({ g }: { g: ShowcaseGame }) {
  const t = useT(landing);
  const rwf = useRwf();
  const emoji = g.icon && !g.icon.startsWith('http') ? g.icon : null;
  return (
    <Link
      href="/register"
      className="group snap-start shrink-0 w-[42vw] xs:w-[170px] sm:w-[190px]"
      aria-label={t('gameAria', { name: g.name, amount: rwf(g.reward) })}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <Poster
          src={g.thumbnailUrl}
          alt=""
          fallbackKey={g.category + g.name}
          fallback={
            emoji ? (
              <span className="text-5xl drop-shadow">{emoji}</span>
            ) : (
              <Gamepad2 className="h-10 w-10 text-white/80" />
            )
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-sm font-bold text-white">{g.name}</p>
          <p className="text-[11px] text-white/60">{pretty(g.category)}</p>
        </div>
        <span className="absolute left-2 top-2 rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold text-[#111827]">
          +{rwf(g.reward)}
        </span>
      </div>
    </Link>
  );
}

function SurveyCard({ s }: { s: ShowcaseSurvey }) {
  const t = useT(landing);
  const rwf = useRwf();
  return (
    <Link
      href="/register"
      className="group snap-start shrink-0 w-[72vw] xs:w-[260px] sm:w-[290px] rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <span className="rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold text-[#111827]">
          +{rwf(s.reward)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-white">{s.title}</p>
      <p className="mt-1 text-xs text-white/45">{t('byBrand', { brand: s.brand })}</p>
      <p className="mt-3 flex items-center gap-3 text-xs text-white/55">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {t('minutes', { n: s.minutes })}
        </span>
        <span>{t('questions', { n: s.questions })}</span>
      </p>
    </Link>
  );
}

export function ContentRails({
  videos,
  games,
  surveys,
}: {
  videos: ShowcaseVideo[];
  games: ShowcaseGame[];
  surveys: ShowcaseSurvey[];
}) {
  const t = useT(landing);
  const tc = useT(common);
  const empty = videos.length + games.length + surveys.length === 0;

  return (
    <section id="earn" className="bg-[#070B14] pb-20 pt-6 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <p className="text-sm font-semibold text-gold">{t('navWays')}</p>
        <h2 className="mt-1 font-rebond-bold text-3xl sm:text-4xl text-white tracking-tight">
          {t('railsTitle')}
        </h2>
        <p className="mt-2 max-w-xl text-white/55">
          {t('railsBody')}
        </p>
      </div>

      {empty ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Play, id: 'videos', title: t('sponsoredVideos'), d: t('emptyVideosDesc') },
            { icon: Gamepad2, id: 'games', title: tc('games'), d: t('emptyGamesDesc') },
            { icon: ClipboardCheck, id: 'surveys', title: tc('surveys'), d: t('emptySurveysDesc') },
          ].map(({ icon: Icon, id, title, d }) => (
            <div key={id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <Icon className="h-6 w-6 text-gold" />
              <p className="mt-3 font-semibold text-white">{title}</p>
              <p className="text-sm text-white/55">{d}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {videos.length > 0 && (
            <Rail title={t('sponsoredVideos')} subtitle={t('railVideosSub')} href="/register">
              {videos.map((v) => (
                <VideoCard key={v.id} v={v} />
              ))}
            </Rail>
          )}
          {games.length > 0 && (
            <Rail title={t('railGamesTitle')} subtitle={t('railGamesSub')} href="/register">
              {games.map((g) => (
                <GameCard key={g.id} g={g} />
              ))}
            </Rail>
          )}
          {surveys.length > 0 && (
            <Rail title={tc('surveys')} subtitle={t('railSurveysSub')} href="/register">
              {surveys.map((s) => (
                <SurveyCard key={s.id} s={s} />
              ))}
            </Rail>
          )}
        </div>
      )}
    </section>
  );
}

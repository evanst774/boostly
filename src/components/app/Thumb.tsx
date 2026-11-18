// src/components/app/Thumb.tsx
'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Remote thumbnail that degrades to a clean poster tile when the URL is
 * missing or broken (never the browser's broken-image + alt text).
 * Fills its positioned parent.
 */
export function Thumb({
  src,
  className,
  iconClassName = 'w-6 h-6',
}: {
  src?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]',
          className,
        )}
      >
        <Play className={cn('text-white/85', iconClassName)} fill="currentColor" />
      </div>
    );
  }
  return (
    // Thumbnails are admin uploads on arbitrary hosts; next/image's
    // remotePatterns allow-list doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
    />
  );
}

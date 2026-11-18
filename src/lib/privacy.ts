// src/lib/privacy.ts

/**
 * How a member is shown to the public (landing page, public APIs):
 * first name + last initial, e.g. "Jean N.". Never a full name, id or contact.
 */
export function publicDisplayName(name: string | null | undefined): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A member';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Clamp a ?limit= query param for public endpoints. */
export function clampLimit(raw: string | null, fallback: number, max: number): number {
  const n = parseInt(raw || '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
}

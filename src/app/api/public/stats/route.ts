// src/app/api/public/stats/route.ts
//
// Public platform figures, from real activity only (same source as the
// landing page). No invented or default numbers.
import { NextResponse } from 'next/server';
import { getLandingData } from '@/lib/landing/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { stats } = await getLandingData();
  return NextResponse.json(stats);
}

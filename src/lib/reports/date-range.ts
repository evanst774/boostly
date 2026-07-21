// src/lib/reports/date-range.ts
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ScopeRange {
  year: number;
  month: number | null;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  startISO: string;
  endISO: string;
  prevStartISO: string;
  prevEndISO: string;
}

export interface TrendBucket {
  label: string;
  startISO: string;
  endISO: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfISOWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfISOWeek(d: Date): Date {
  const s = startOfISOWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function resolveScopeRange(params: {
  year?: string | null;
  month?: string | null;
}): ScopeRange {
  const now = new Date();
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();

  const hasMonth =
    params.month !== undefined && params.month !== null && params.month !== '';
  const parsedMonth = hasMonth ? parseInt(params.month as string, 10) : NaN;
  const month = hasMonth && Number.isFinite(parsedMonth) ? parsedMonth : null;

  let start: Date;
  let end: Date;
  let prevStart: Date;
  let prevEnd: Date;

  if (month !== null) {
    const safeMonth = Math.max(0, Math.min(11, month));
    start = new Date(year, safeMonth, 1);
    end = endOfDay(new Date(year, safeMonth + 1, 0));
    const prevMonthDate = new Date(year, safeMonth - 1, 1);
    prevStart = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
      1,
    );
    prevEnd = endOfDay(
      new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0),
    );
  } else {
    start = new Date(year, 0, 1);
    end = endOfDay(new Date(year, 11, 31));
    prevStart = new Date(year - 1, 0, 1);
    prevEnd = endOfDay(new Date(year - 1, 11, 31));
  }

  return {
    year,
    month,
    start,
    end,
    prevStart,
    prevEnd,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    prevStartISO: prevStart.toISOString(),
    prevEndISO: prevEnd.toISOString(),
  };
}

// ============================================================
// Period-aware scope for KPIs, top-bikes, staff, payments, insights.
// Supports "All Years" when `year` param is missing/null/empty.
// ============================================================
export function resolveScopeFromPeriod(params: {
  period: PeriodType;
  year?: string | null;
  month?: string | null;
}): ScopeRange {
  const now = new Date();
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();
  const isAllYears = !params.year || params.year === '';

  const hasMonth =
    params.month !== undefined && params.month !== null && params.month !== '';
  const parsedMonth = hasMonth ? parseInt(params.month as string, 10) : NaN;
  const month =
    hasMonth && Number.isFinite(parsedMonth)
      ? Math.max(0, Math.min(11, parsedMonth))
      : null;

  let start: Date;
  let end: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (params.period) {
    case 'daily': {
      const m = hasMonth ? month! : now.getMonth();
      const d = hasMonth ? 1 : now.getDate();
      start = startOfDay(new Date(year, m, d));
      end = endOfDay(start);
      prevStart = addDays(start, -1);
      prevEnd = endOfDay(prevStart);
      break;
    }
    case 'weekly': {
      const anchor = hasMonth
        ? new Date(year, month!, 1)
        : new Date(year, now.getMonth(), now.getDate());
      start = startOfISOWeek(anchor);
      end = endOfISOWeek(anchor);
      prevStart = addDays(start, -7);
      prevEnd = addDays(end, -7);
      break;
    }
    case 'yearly': {
      // "All Years" → 10 years; single year → 1 year
      const startYear = isAllYears ? year - 9 : year;
      start = startOfDay(new Date(startYear, 0, 1));
      end = endOfDay(new Date(year, 11, 31));
      prevStart = startOfDay(new Date(startYear - 1, 0, 1));
      prevEnd = endOfDay(new Date(year - 1, 11, 31));
      break;
    }
    case 'monthly':
    default: {
      if (hasMonth) {
        start = startOfDay(new Date(year, month!, 1));
        end = endOfDay(new Date(year, month! + 1, 0));
        const prevMonthDate = new Date(year, month! - 1, 1);
        prevStart = startOfDay(
          new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1),
        );
        prevEnd = endOfDay(
          new Date(
            prevMonthDate.getFullYear(),
            prevMonthDate.getMonth() + 1,
            0,
          ),
        );
      } else {
        const startYear = isAllYears ? year - 9 : year;
        start = startOfDay(new Date(startYear, 0, 1));
        end = endOfDay(new Date(year, 11, 31));
        prevStart = startOfDay(new Date(startYear - 1, 0, 1));
        prevEnd = endOfDay(new Date(year - 1, 11, 31));
      }
      break;
    }
  }

  return {
    year,
    month: hasMonth ? month : null,
    start,
    end,
    prevStart,
    prevEnd,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    prevStartISO: prevStart.toISOString(),
    prevEndISO: prevEnd.toISOString(),
  };
}

// ============================================================
// Trend scope: creates a parent window wide enough to produce
// multiple chart buckets, while respecting month filter and
// supporting "All Years" for full historical view.
// ============================================================
export function resolveTrendScope(params: {
  period: PeriodType;
  year?: string | null;
  month?: string | null;
}): { start: Date; end: Date; startISO: string; endISO: string } {
  const now = new Date();
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();
  const isAllYears = !params.year || params.year === '';

  const hasMonth =
    params.month !== undefined && params.month !== null && params.month !== '';
  const parsedMonth = hasMonth ? parseInt(params.month as string, 10) : NaN;
  const month =
    hasMonth && Number.isFinite(parsedMonth)
      ? Math.max(0, Math.min(11, parsedMonth))
      : null;

  let start: Date;
  let end: Date;

  switch (params.period) {
    case 'daily': {
      if (month !== null) {
        start = startOfDay(new Date(year, month, 1));
        end = endOfDay(new Date(year, month + 1, 0));
      } else {
        start = startOfDay(new Date(year, now.getMonth(), 1));
        end = endOfDay(new Date(year, now.getMonth() + 1, 0));
      }
      break;
    }
    case 'weekly': {
      if (month !== null) {
        start = startOfISOWeek(new Date(year, month, 1));
        end = endOfISOWeek(new Date(year, month + 1, 0));
      } else {
        const startYear = isAllYears ? year - 9 : year;
        start = startOfISOWeek(new Date(startYear, 0, 1));
        end = endOfISOWeek(new Date(year, 11, 31));
      }
      break;
    }
    case 'yearly': {
      // Single year → 5 years for context; All Years → 10 years
      const rangeYears = isAllYears ? 9 : 4;
      start = startOfDay(new Date(year - rangeYears, 0, 1));
      end = endOfDay(new Date(year, 11, 31));
      break;
    }
    case 'monthly':
    default: {
      const startYear = isAllYears ? year - 9 : year;
      start = startOfDay(new Date(startYear, 0, 1));
      end = endOfDay(new Date(year, 11, 31));
      break;
    }
  }

  return {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

// ============================================================
const VALID_PERIODS: PeriodType[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function resolveBucketPeriod(period?: string | null): PeriodType {
  return VALID_PERIODS.includes(period as PeriodType)
    ? (period as PeriodType)
    : 'monthly';
}

export function buildTrendBuckets(
  scope: { start: Date; end: Date },
  bucketPeriod: PeriodType,
): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  let cursor = new Date(
    scope.start.getFullYear(),
    scope.start.getMonth(),
    scope.start.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(scope.end);
  const MAX_ITERATIONS = 4000; // enough for 10+ years of daily buckets
  let iterations = 0;

  while (cursor <= end && iterations < MAX_ITERATIONS) {
    iterations++;

    let bucketStart: Date;
    let bucketEnd: Date;
    let label: string;
    let nextCursor: Date;

    switch (bucketPeriod) {
      case 'yearly': {
        bucketStart = new Date(cursor.getFullYear(), 0, 1, 0, 0, 0, 0);
        bucketEnd = endOfDay(new Date(cursor.getFullYear(), 11, 31));
        label = String(cursor.getFullYear());
        nextCursor = new Date(cursor.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
        break;
      }
      case 'monthly': {
        bucketStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        bucketEnd = endOfDay(
          new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
        );
        // Include year in label for multi-year views
        if (scope.end.getFullYear() - scope.start.getFullYear() > 1) {
          label = bucketStart.toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          });
        } else {
          label = bucketStart.toLocaleDateString('en-US', { month: 'short' });
        }
        nextCursor = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          1,
          0,
          0,
          0,
          0,
        );
        break;
      }
      case 'weekly': {
        bucketStart = startOfISOWeek(cursor);
        bucketEnd = endOfISOWeek(cursor);
        const day = bucketStart.getDate();
        const shortMonth = bucketStart.toLocaleDateString('en-US', {
          month: 'short',
        });
        // Include year for multi-year views
        if (scope.end.getFullYear() - scope.start.getFullYear() > 1) {
          const yr = bucketStart.getFullYear().toString().slice(-2);
          label = `${shortMonth} ${day} '${yr}`;
        } else {
          label = `${shortMonth} ${day}`;
        }
        nextCursor = addDays(bucketEnd, 1);
        nextCursor.setHours(0, 0, 0, 0);
        break;
      }
      case 'daily': {
        bucketStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          0,
          0,
          0,
          0,
        );
        bucketEnd = endOfDay(cursor);
        const shortMonth = bucketStart.toLocaleDateString('en-US', {
          month: 'short',
        });
        label = `${shortMonth} ${cursor.getDate()}`;
        nextCursor = addDays(cursor, 1);
        nextCursor.setHours(0, 0, 0, 0);
        break;
      }
      default: {
        bucketStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        bucketEnd = endOfDay(
          new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
        );
        label = bucketStart.toLocaleDateString('en-US', { month: 'short' });
        nextCursor = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          1,
          0,
          0,
          0,
          0,
        );
      }
    }

    const clampedEnd = bucketEnd > end ? new Date(end) : bucketEnd;

    buckets.push({
      label,
      startISO: bucketStart.toISOString(),
      endISO: clampedEnd.toISOString(),
    });

    if (nextCursor <= cursor) {
      console.warn(
        `buildTrendBuckets: cursor did not advance (${cursor.toISOString()}), forcing +1 day`,
      );
      cursor = addDays(cursor, 1);
      cursor.setHours(0, 0, 0, 0);
    } else {
      cursor = nextCursor;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.error(
      'buildTrendBuckets: hit MAX_ITERATIONS — possible infinite loop prevented. ' +
        `period=${bucketPeriod}, scope=${scope.start.toISOString()}..${scope.end.toISOString()}`,
    );
  }

  return buckets;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// src/modules/content/plan-access.ts
//
// Which plans may use a video, game or survey. `allowedPlanTiers` holds plan
// keys (e.g. ["GOLD","PLATINUM"]); null or [] means every plan, including Free.
import { sql, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export function canUsePlan(allowed: string[] | null | undefined, tier: string): boolean {
  return !allowed || allowed.length === 0 || allowed.includes(tier);
}

/** SQL condition: the item is open to this plan tier. */
export function planAllowsSql(column: AnySQLiteColumn, tier: string): SQL {
  return sql`(${column} IS NULL OR json_array_length(${column}) = 0 OR EXISTS (SELECT 1 FROM json_each(${column}) WHERE json_each.value = ${tier}))`;
}

export const PLAN_LOCKED_MESSAGE = 'This task is for members on another plan. Upgrade your plan to unlock it.';

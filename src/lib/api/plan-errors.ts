// src/lib/api/plan-errors.ts
// Turns plan editor errors into a status + a message an admin can act on.
import { ZodError } from 'zod';

export function planErrorResponse(error: unknown): { status: number; error: string } {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path?.join('.') || 'value';
    return { status: 400, error: `${field}: ${issue?.message ?? 'Invalid value'}` };
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  if (/^Forbidden|permission/i.test(message)) return { status: 403, error: message };
  if (/not found/i.test(message)) return { status: 404, error: message };
  if (
    /already exists|can't be|cannot be|must cost|need a monthly price|still has|subscribers/i.test(message)
  ) {
    return { status: 400, error: message };
  }
  return { status: 500, error: message };
}

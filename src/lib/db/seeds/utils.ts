// src/lib/db/seeds/utils.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function clearTable(table: any) {
  try {
    await db.delete(table);
    console.log(`  🧹 Cleared ${table._?.name || 'table'}`);
  } catch (error) {
    console.log(`  ⚠️ Could not clear ${table._?.name || 'table'}`);
  }
}

export async function existsInTable(table: any, field: string, value: string) {
  const result = await (db.query as any)[table._?.name || 'table'].findFirst({
    where: (t: any) => t[field] === value,
  });
  return !!result;
}

export function generateId() {
  return crypto.randomUUID();
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2) {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export function generateReferralCode(userId: string) {
  return `REF${userId.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
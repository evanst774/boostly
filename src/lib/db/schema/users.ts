// src/lib/db/schema/users.ts

import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { roles, userRoles } from "./rbac";
import { sessions } from "./auth";

// ============================================
// USERS TABLE
// ============================================
export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("passwordHash"),
    roleId: text("roleId").references(() => roles.id, { onDelete: "set null" }),
    phone: text("phone"),
    avatar: text("avatar"),
    avatarKey: text("avatarKey"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(false),
    lastLoginAt: text("lastLoginAt"),
    emailVerifiedAt: text("emailVerifiedAt"),
    emailVerificationToken: text("emailVerificationToken").unique(),
    passwordResetToken: text("passwordResetToken").unique(),
    passwordResetExpires: text("passwordResetExpires"),
    failedLoginAttempts: integer("failedLoginAttempts").notNull().default(0),
    accountLockedUntil: text("accountLockedUntil"),
    failedVerificationAttempts: integer("failedVerificationAttempts").default(0),
    verificationLockedUntil: text("verificationLockedUntil"),
    is2FAEnabled: integer("is2FAEnabled", { mode: "boolean" }).notNull().default(false),
    twoFAEnabledMethods: text("twoFAEnabledMethods", { mode: "json" }).$type<('EMAIL' | 'TOTP')[]>().default([]),
    twoFADefaultMethod: text("twoFADefaultMethod").$type<"EMAIL" | "TOTP">(),
    totpSecret: text("totpSecret"),
    totpBackupCodes: text("totpBackupCodes", { mode: "json" }),
    createdAt: text("createdAt").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updatedAt").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.roleId),
    index("users_email_verification_token_idx").on(table.emailVerificationToken),
    index("users_password_reset_token_idx").on(table.passwordResetToken),
]);

// ============================================
// USER RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    userRoles: many(userRoles),
    sessions: many(sessions),
}));

// ============================================
// TYPES
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
// ============================================
// SAFE COLUMN SETS FOR RELATION LOADS
// ============================================
// Never load a related user with `{ user: true }`: that selects every column,
// including passwordHash, reset/verification tokens, totpSecret and backup
// codes, and those end up in API responses. Use one of these instead.

/** Visible to other users (comments, leaderboards, public engagement). */
export const PUBLIC_USER_COLUMNS = {
  id: true,
  name: true,
  avatar: true,
} as const;

/** For admin screens and a user's own data (adds contact details). */
export const SAFE_USER_COLUMNS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
} as const;

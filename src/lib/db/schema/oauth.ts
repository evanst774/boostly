// src/lib/db/schema/oauth.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ENUMS
// ============================================

export const OAuthProviderEnum = {
  GOOGLE: 'GOOGLE',
  FACEBOOK: 'FACEBOOK',
} as const;

export type OAuthProvider =
  (typeof OAuthProviderEnum)[keyof typeof OAuthProviderEnum];
export const OAUTH_PROVIDER_LIST = Object.values(OAuthProviderEnum);

// ============================================
// OAUTH ACCOUNTS
// ============================================

/**
 * Links a Boostly user to an external identity provider.
 *
 * A user may have several rows here (Google AND Facebook AND a password), but
 * a given provider account can only ever map to one Boostly user — enforced by
 * the unique index on (provider, providerAccountId). Without that constraint,
 * two Boostly accounts could claim the same Google identity and whichever
 * lookup ran first would win.
 */
export const oauthAccounts = sqliteTable(
  'oauth_accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    provider: text('provider').$type<OAuthProvider>().notNull(),

    /** The provider's stable user id ("sub" for Google). NOT the email. */
    providerAccountId: text('providerAccountId').notNull(),

    /** Email as the provider reported it, for auditing link decisions later. */
    providerEmail: text('providerEmail'),

    /**
     * Whether the PROVIDER vouched for the email at link time. Auto-linking an
     * unverified provider email to an existing account is account takeover:
     * anyone can create a Facebook account claiming someone else's address.
     */
    providerEmailVerified: integer('providerEmailVerified', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),

    providerName: text('providerName'),
    providerAvatar: text('providerAvatar'),

    /**
     * Stored only if you later need to call the provider's API on the user's
     * behalf. For plain sign-in you don't need these at all — leaving them null
     * is one less secret to protect.
     */
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    tokenExpiresAt: text('tokenExpiresAt'),

    lastUsedAt: text('lastUsedAt'),

    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('oauth_accounts_user_idx').on(table.userId),
    index('oauth_accounts_email_idx').on(table.providerEmail),
    // One external identity -> at most one Boostly user.
    uniqueIndex('oauth_accounts_provider_account_idx').on(
      table.provider,
      table.providerAccountId,
    ),
    // One linked account per provider per user.
    uniqueIndex('oauth_accounts_user_provider_idx').on(
      table.userId,
      table.provider,
    ),
  ],
);

// ============================================
// TYPES
// ============================================
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

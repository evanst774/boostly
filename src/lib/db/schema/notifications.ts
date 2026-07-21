// src/lib/db/schema/notifications.ts
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

// ============================================
// ENUMS
// ============================================
export const NotificationTypeEnum = {
    INFO: "INFO",
    WARNING: "WARNING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
    REMINDER: "REMINDER",
} as const;

export type NotificationType = typeof NotificationTypeEnum[keyof typeof NotificationTypeEnum];

// ============================================
// NOTIFICATIONS TABLE
// ============================================
export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    title: text("title").notNull(),
    message: text("message").notNull(),

    userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().default(NotificationTypeEnum.INFO),

    isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),

    // For action links
    link: text("link"),
    linkText: text("linkText"),

    // Related entity
    entityType: text("entityType"),
    entityId: text("entityId"),

    createdAt: text("createdAt").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
]);

// ============================================
// TYPES
// ============================================
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
import { text, integer, boolean, timestamp, pgTable, json } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

// Helpers
const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

// ============================================
// USERS & AUTH
// ============================================

export const roles = pgTable("roles", {
    id: text("id").primaryKey(), // "admin", "teknisi", "kasir"
    name: text("name").notNull(),
    permissions: json("permissions").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().references(() => roles.id).default("teknisi"),
    name: text("name").notNull(),
    image: text("image"),
    commissionConfig: json("commission_config"),
    isActive: boolean("is_active").default(true),
    ...timestamps(),
});

export const userRoles = pgTable("user_roles", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text("role").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow()
});

export const userSessions = pgTable("user_sessions", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text("role").notNull(),
    loginTime: timestamp("login_time").defaultNow(),
    logoutTime: timestamp("logout_time"),
    isActive: boolean("is_active").default(true)
});



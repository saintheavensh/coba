import { sql, relations } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// Users (Admin, Teknisi, Kasir)
export const users = sqliteTable("users", {
    id: text("id").primaryKey(), // UUID
    username: text("username").notNull().unique(),
    password: text("password").notNull(), // Hashed
    role: text("role", { enum: ["admin", "teknisi", "kasir"] }).notNull().default("teknisi"),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Products (Inventory)
export const products = sqliteTable("products", {
    id: text("id").primaryKey(), // PRD-XXX
    name: text("name").notNull(),
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").default(5),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Product Batches (FIFO)
export const productBatches = sqliteTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX
    productId: text("product_id").notNull().references(() => products.id),
    supplier: text("supplier"),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Services
export const services = sqliteTable("services", {
    id: integer("id").primaryKey(), // Auto increment ID
    no: text("no").notNull().unique(), // SRV-YYYY-XXX

    // JSON fields for flexibility
    customer: text("customer", { mode: "json" }).notNull(), // { name, phone, address }
    device: text("device", { mode: "json" }).notNull(), // { brand, model, imei, equipment }

    complaint: text("complaint").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),

    status: text("status", { enum: ["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"] }).default("antrian"),

    technicianId: text("technician_id").references(() => users.id),

    costEstimate: integer("cost_estimate"),
    actualCost: integer("actual_cost"),

    dateIn: integer("date_in", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    dateOut: integer("date_out", { mode: "timestamp" }),
});

// Activity Logs
export const activityLogs = sqliteTable("activity_logs", {
    id: integer("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    description: text("description"),
    timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Settings (Key-Value Store)
export const settings = sqliteTable("settings", {
    key: text("key").primaryKey(),
    value: text("value", { mode: "json" }).notNull(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
    batches: many(productBatches),
}));

export const productBatchesRelations = relations(productBatches, ({ one }) => ({
    product: one(products, {
        fields: [productBatches.productId],
        references: [products.id],
    }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
    technician: one(users, {
        fields: [services.technicianId],
        references: [users.id],
    }),
}));

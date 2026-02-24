import { relations } from "drizzle-orm";
import { text, integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { users } from "../../../../db/schema"; // Hub reference
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productBatches } from "./BatchSchema";

// Function definition wrapper for uuid isn't globally available here so recreating local or referring.
const uuid = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
    id: text("id").primaryKey(),
    status: text("status", { enum: ["draft", "completed", "cancelled"] }).default("draft"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
    id: uuid(), // CHANGED: serial -> uuid
    sessionId: text("session_id").notNull().references(() => stockOpnameSessions.id, { onDelete: 'cascade' }),
    productId: text("product_id").notNull().references(() => products.id),
    variantName: text("variant_name"),
    batchId: text("batch_id").references(() => productBatches.id),
    systemStock: integer("system_stock").notNull(),
    physicalStock: integer("physical_stock"),
    adjustmentReason: text("adjustment_reason"),
});

export const stockOpnameSessionsRelations = relations(stockOpnameSessions, ({ one, many }) => ({
    user: one(users, {
        fields: [stockOpnameSessions.userId],
        references: [users.id],
    }),
    items: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
    session: one(stockOpnameSessions, {
        fields: [stockOpnameItems.sessionId],
        references: [stockOpnameSessions.id],
    }),
    product: one(products, {
        fields: [stockOpnameItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [stockOpnameItems.batchId],
        references: [productBatches.id],
    }),
}));

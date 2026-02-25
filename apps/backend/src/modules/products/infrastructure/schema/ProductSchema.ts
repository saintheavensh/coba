import { relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { categories } from "../../../categories/infrastructure/schema/CategorySchema";

// Importing relations from the monolithic schema hub for unmigrated modules
import {
    productBatches,
    purchaseItems,
    saleItems,
    productDeviceCompatibility,
    productVariants
} from "../../../../db/schema";

export const products = pgTable("products", {
    id: text("id").primaryKey(), // PRD-XXX
    code: text("code").unique(),
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    image: text("image"),
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").default(5),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    categoryIdx: index("products_category_idx").on(table.categoryId),
    createdAtIdx: index("products_created_at_idx").on(table.createdAt),
    codeIdx: index("products_code_idx").on(table.code),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    batches: many(productBatches),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
    compatibility: many(productDeviceCompatibility),
    variants: many(productVariants),
}));

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

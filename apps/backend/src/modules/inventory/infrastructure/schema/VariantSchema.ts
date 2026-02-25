import { relations } from "drizzle-orm";
import { text, integer, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productBatches } from "./BatchSchema";

export const productVariants = pgTable("product_variants", {
    id: text("id").primaryKey(), // VAR-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    name: text("name").notNull(),
    image: text("image"),
    sku: text("sku"),
    defaultPrice: integer("default_price"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    productIdx: index("product_variants_product_idx").on(table.productId),
    skuIdx: index("product_variants_sku_idx").on(table.sku),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
    batches: many(productBatches),
}));

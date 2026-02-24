import { relations } from "drizzle-orm";
import { text, integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productVariants } from "./VariantSchema";
import { suppliers, purchaseItems, saleItems } from "../../../../db/schema"; // Still in hub for now

export const productBatches = pgTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    supplierId: text("supplier_id").references(() => suppliers.id),

    supplierName: text("supplier_name"),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const productBatchesRelations = relations(productBatches, ({ one, many }) => ({
    product: one(products, {
        fields: [productBatches.productId],
        references: [products.id],
    }),
    supplier: one(suppliers, {
        fields: [productBatches.supplierId],
        references: [suppliers.id],
    }),
    variantLink: one(productVariants, {
        fields: [productBatches.variantId],
        references: [productVariants.id],
    }),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
}));

import { relations } from "drizzle-orm";
import { text, integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productBatches } from "./BatchSchema";
import { suppliers } from "../../../../db/schema"; // Still in hub for now

export const defectiveItems = pgTable("defective_items", {
    id: text("id").primaryKey(), // DEF-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    qty: integer("qty").notNull(),
    source: text("source").notNull(),
    sourceRefId: text("source_ref_id"),
    reason: text("reason"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const defectiveItemsRelations = relations(defectiveItems, ({ one }) => ({
    product: one(products, {
        fields: [defectiveItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [defectiveItems.batchId],
        references: [productBatches.id],
    }),
    supplier: one(suppliers, {
        fields: [defectiveItems.supplierId],
        references: [suppliers.id],
    }),
}));

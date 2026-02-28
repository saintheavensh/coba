import { text, integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productBatches } from "./BatchSchema";
import { suppliers } from "../../../../01-purchases/suppliers/infrastructure/schema/SupplierSchema";

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



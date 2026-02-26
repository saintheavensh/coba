import { text, timestamp, pgTable, boolean } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productVariants } from "../../../inventory/infrastructure/schema/VariantSchema";

const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const suppliers = pgTable("suppliers", {
    id: text("id").primaryKey(), // SUP-XXX
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    address: text("address"),
    image: text("image"),
    ...timestamps(),
});

export const supplierProductVariants = pgTable("supplier_product_variants", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});



import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { brands } from "../../../../05-shared/devices/infrastructure/schema/BrandSchema";



export const products = pgTable("products", {
    id: text("id").primaryKey(), // PRD-XXX
    code: text("code").unique(),
    name: text("name").notNull(),
    categoryId: text("category_id"),
    image: text("image"),
    brandId: text("brand_id").references(() => brands.id),
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


export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

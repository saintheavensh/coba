import { pgTable, text, timestamp, foreignKey, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { suppliers } from "../../../suppliers/infrastructure/schema/SupplierSchema";

const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());

export const categories = pgTable("categories", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "categories_parent_id_fkey"
    })
}));

export const categoryVariants = pgTable("category_variants", {
    id: uuid(),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
});

export const supplierCategories = pgTable("supplier_categories", {
    id: uuid(),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
    unq: unique("sup_cat_unique").on(t.supplierId, t.categoryId),
}));



export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

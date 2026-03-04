import { pgTable, text, timestamp, foreignKey, unique, boolean, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { suppliers } from "../../../../01-purchases/suppliers/infrastructure/schema/SupplierSchema";

const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());

export const categories = pgTable("categories", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()), // UUID PK
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "categories_parent_id_fkey"
    }),
    parentIdx: index("categories_parent_id_idx").on(table.parentId)
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

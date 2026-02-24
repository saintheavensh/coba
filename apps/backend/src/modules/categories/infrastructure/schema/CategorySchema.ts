import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, foreignKey } from "drizzle-orm/pg-core";

// We import other tables from the monolithic hub for cross-module relations to avoid breaking them during migration.
import { products, categoryVariants, supplierCategories } from "../../../../db/schema";

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

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    products: many(products),
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "category_hierarchy"
    }),
    children: many(categories, {
        relationName: "category_hierarchy"
    }),
    variantTemplates: many(categoryVariants),
    suppliers: many(supplierCategories),
}));

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

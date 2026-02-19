import { db } from "../../../db";
import { suppliers, supplierCategories, categories, categoryVariants } from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";

export class SuppliersModel {
    async findAll() {
        return await db.query.suppliers.findMany({
            orderBy: [desc(suppliers.createdAt)],
        });
    }

    async findById(id: string) {
        return await db.query.suppliers.findFirst({
            where: eq(suppliers.id, id)
        });
    }

    async getLinkedCategories(supplierId: string) {
        // Explicitly join using the new table
        const result = await db
            .select({
                id: categories.id,
                name: categories.name,
                parentId: categories.parentId
            })
            .from(supplierCategories)
            .innerJoin(categories, eq(supplierCategories.categoryId, categories.id))
            .where(eq(supplierCategories.supplierId, supplierId));
        return result;
    }

    async create(data: typeof suppliers.$inferInsert) {
        return await db.insert(suppliers).values(data).returning();
    }

    async update(id: string, data: Partial<typeof suppliers.$inferInsert>) {
        return await db.update(suppliers)
            .set(data)
            .where(eq(suppliers.id, id))
            .returning();
    }

    async delete(id: string) {
        // Delete linked category variants first (no cascade in schema)
        await db.delete(categoryVariants).where(eq(categoryVariants.supplierId, id));

        return await db.delete(suppliers).where(eq(suppliers.id, id));
    }

    async addCategoryLink(supplierId: string, categoryId: string) {
        await db.insert(supplierCategories)
            .values({ supplierId, categoryId })
            .onConflictDoNothing();
    }

    async removeCategoryLink(supplierId: string, categoryId: string) {
        await db.delete(supplierCategories)
            .where(
                and(
                    eq(supplierCategories.supplierId, supplierId),
                    eq(supplierCategories.categoryId, categoryId)
                )
            );
    }
}

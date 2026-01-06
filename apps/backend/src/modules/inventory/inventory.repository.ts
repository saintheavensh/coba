import { db } from "../../db";
import { products, productBatches, categories } from "../../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export class InventoryRepository {
    async findAll() {
        return await db.query.products.findMany({
            with: {
                category: true
            },
            orderBy: [desc(products.name)]
        });
    }

    async findById(id: string) {
        return await db.query.products.findFirst({
            where: eq(products.id, id),
            with: {
                category: true,
                batches: true
            }
        });
    }

    async createProduct(data: typeof products.$inferInsert) {
        return await db.insert(products).values(data).returning();
    }

    async updateProduct(id: string, data: Partial<typeof products.$inferInsert>) {
        return await db.update(products)
            .set(data)
            .where(eq(products.id, id))
            .returning();
    }

    async deleteProduct(id: string) {
        return await db.delete(products).where(eq(products.id, id));
    }

    async findVariantsBySupplier(supplierId: string) {
        // Find distinct variants for this supplier across ALL products
        const results = await db
            .selectDistinct({ variant: productBatches.variant })
            .from(productBatches)
            .where(
                and(
                    eq(productBatches.supplierId, supplierId),
                    sql`${productBatches.variant} IS NOT NULL`,
                    sql`${productBatches.variant} != ''`
                )
            );

        return results.map((r) => r.variant);
    }


}

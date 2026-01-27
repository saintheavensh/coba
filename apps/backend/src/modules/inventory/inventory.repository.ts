import { db } from "../../db";
import { products, productBatches, categories, productDeviceCompatibility, productVariants } from "../../db/schema";
import { eq, desc, and, sql, or, ilike } from "drizzle-orm";

export class InventoryRepository {
    async findAll(deviceId?: string, search?: string, categoryId?: string) {
        let whereClause: any = undefined;

        const conditions = [];

        if (deviceId) {
            conditions.push(
                sql`${products.id} IN (
                    SELECT ${productDeviceCompatibility.productId} 
                    FROM ${productDeviceCompatibility} 
                    WHERE ${productDeviceCompatibility.deviceId} = ${deviceId}
                )`
            );
        }

        if (categoryId && categoryId !== "all") {
            conditions.push(eq(products.categoryId, categoryId));
        }

        if (search && search.trim()) {
            const term = search.trim();
            conditions.push(
                or(
                    sql`${products.name} || ' ' || ${products.code} ILIKE ${"%" + term + "%"}`,
                    ilike(products.name, `%${term}%`),
                    ilike(products.code, `%${term}%`)
                )
            );
        }

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const queryOptions: any = {
            with: {
                category: true,
                batches: {
                    with: {
                        supplier: true
                    }
                },
                variants: true,
            },
            where: whereClause
        };

        // Add Relevance Sorting if search is provided
        if (search && search.trim()) {
            const term = search.trim();
            queryOptions.orderBy = [
                sql`CASE 
                    WHEN ${products.name} ILIKE ${term} THEN 1
                    WHEN ${products.name} ILIKE ${term + "%"} THEN 2
                    WHEN ${products.name} ILIKE ${"%" + term + "%"} THEN 3
                    ELSE 4
                END`,
                products.name
            ];
        } else {
            queryOptions.orderBy = [desc(products.name)];
        }

        const items = await db.query.products.findMany(queryOptions);

        return items.map((item: any) => ({
            ...item,
            price: item.batches && item.batches.length > 0 ? item.batches[0].sellPrice : 0
        }));
    }

    async findById(id: string) {
        const result = await db.query.products.findFirst({
            where: eq(products.id, id),
            with: {
                category: true,
                batches: true,
                variants: true,
                compatibility: {
                    with: {
                        device: true
                    }
                }
            }
        });

        if (!result) return null;

        return {
            ...result,
            compatibility: result.compatibility.map((r) => r.device)
        };
    }

    async createProduct(data: typeof products.$inferInsert & { compatibility?: string[] }) {
        const productResult = await db.insert(products).values(data).returning();
        const product = productResult[0];

        if (data.compatibility && data.compatibility.length > 0) {
            await db.insert(productDeviceCompatibility).values(
                data.compatibility.map(deviceId => ({
                    productId: product.id,
                    deviceId
                }))
            );
        }
        return product;
    }

    async updateProduct(id: string, data: Partial<typeof products.$inferInsert> & { compatibility?: string[] }) {
        // 1. Update Product fields
        const updateData: Partial<typeof products.$inferInsert> = { ...data };
        delete (updateData as any).compatibility; // Remove compatibility from product update payload

        const result = await db.update(products)
            .set({
                ...updateData,
                // explicit fields to ensure safety if generic spread includes extra
            })
            .where(eq(products.id, id))
            .returning();

        // 2. Update Compatibility (if provided)
        if (data.compatibility) {
            // Transactional update: delete all existing, insert new
            await db.delete(productDeviceCompatibility).where(eq(productDeviceCompatibility.productId, id));

            if (data.compatibility.length > 0) {
                await db.insert(productDeviceCompatibility).values(
                    data.compatibility.map(deviceId => ({
                        productId: id,
                        deviceId
                    }))
                );
            }
        }

        return result[0];
    }

    async deleteProduct(id: string) {
        return await db.delete(products).where(eq(products.id, id));
    }

    // Bulk update minStock for all products in a category
    async updateMinStockByCategory(categoryId: string, minStock: number): Promise<number> {
        const result = await db.update(products)
            .set({ minStock })
            .where(eq(products.categoryId, categoryId))
            .returning();
        return result.length;
    }

    // Count products by category
    async countByCategory(categoryId: string): Promise<number> {
        const result = await db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.categoryId, categoryId));
        return Number(result[0]?.count || 0);
    }

    async findRecentVariantIdsBySupplier(supplierId: string) {
        // Return Variant IDs sorted by most recent batch creation
        const results = await db
            .select({ variantId: productBatches.variantId, lastDate: sql`MAX(${productBatches.createdAt})` })
            .from(productBatches)
            .where(
                and(
                    eq(productBatches.supplierId, supplierId),
                    sql`${productBatches.variantId} IS NOT NULL`
                )
            )
            .groupBy(productBatches.variantId)
            .orderBy(desc(sql`MAX(${productBatches.createdAt})`));

        return results.map(r => r.variantId as string);
    }




    // Variants
    async createVariant(data: typeof productVariants.$inferInsert) {
        const result = await db.insert(productVariants).values(data).returning();
        return result[0];
    }

    async updateVariant(id: string, data: Partial<typeof productVariants.$inferInsert>) {
        const result = await db.update(productVariants)
            .set(data)
            .where(eq(productVariants.id, id))
            .returning();
        return result[0];
    }

    async findVariantsByProductId(productId: string) {
        return await db.query.productVariants.findMany({
            where: eq(productVariants.productId, productId),
            orderBy: [desc(productVariants.createdAt)]
        });
    }

    async deleteVariant(id: string) {
        return await db.delete(productVariants).where(eq(productVariants.id, id));
    }
}

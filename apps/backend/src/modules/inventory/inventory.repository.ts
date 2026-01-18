import { db } from "../../db";
import { products, productBatches, categories, productDeviceCompatibility } from "../../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export class InventoryRepository {
    async findAll(deviceId?: string) {
        const queryOptions: any = {
            with: {
                category: true,
                batches: true // Required for Sales FIFO aggregation
            },
            orderBy: [desc(products.name)]
        };

        if (deviceId) {
            // Filter by device compatibility
            queryOptions.where = (products: any, { inArray, eq }: any) =>
                inArray(
                    products.id,
                    db.select({ id: productDeviceCompatibility.productId })
                        .from(productDeviceCompatibility)
                        .where(eq(productDeviceCompatibility.deviceId, deviceId))
                );
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
            // Check if productDeviceCompatibility is imported
            const { productDeviceCompatibility } = await import("../../db/schema");
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
        const result = await db.update(products)
            .set({
                name: data.name,
                code: data.code,
                categoryId: data.categoryId,
                image: data.image,
                minStock: data.minStock
                // Note: Don't set compatibility here, it's a relation
            })
            .where(eq(products.id, id))
            .returning();

        if (data.compatibility) {
            const { productDeviceCompatibility } = await import("../../db/schema");
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

        return result;
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

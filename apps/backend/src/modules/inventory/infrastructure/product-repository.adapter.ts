/**
 * Drizzle-based product repository adapter.
 * Implements IProductRepository from the domain layer.
 */
import type { IProductRepository } from "../domain/product-repository.port";
import type {
    ProductEntity,
    ProductBatchEntity,
    CreateProductData,
    UpdateProductData,
    InventoryStats,
    SearchResult
} from "../domain/product.entity";
import { db } from "../../../db";
import { products, productBatches, categories, productDeviceCompatibility, productVariants, categoryVariants } from "../../../db/schema";
import { eq, desc, and, sql, or, ilike, inArray } from "drizzle-orm";

export class ProductRepositoryAdapter implements IProductRepository {
    async findAll(deviceId?: string, search?: string, categoryId?: string, dbOrTx: any = db): Promise<ProductEntity[]> {
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

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const queryOptions: any = {
            with: {
                category: true,
                batches: { with: { supplier: true } },
                variants: true,
            },
            where: whereClause
        };

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

        const items = await dbOrTx.query.products.findMany(queryOptions);

        return items.map((item: any) => ({
            ...item,
            price: item.batches && item.batches.length > 0 ? item.batches[0].sellPrice : 0
        }));
    }

    async findById(id: string, dbOrTx: any = db): Promise<ProductEntity | null> {
        const result = await dbOrTx.query.products.findFirst({
            where: eq(products.id, id),
            with: {
                category: true,
                batches: true,
                variants: true,
                compatibility: { with: { device: true } }
            }
        });

        if (!result) return null;

        return {
            ...result,
            compatibility: result.compatibility.map((r: any) => r.device)
        };
    }

    async createProduct(data: CreateProductData, dbOrTx: any = db): Promise<ProductEntity> {
        const { compatibility, ...productData } = data;
        const productResult = await dbOrTx.insert(products).values(productData).returning();
        const product = productResult[0];

        if (compatibility && compatibility.length > 0) {
            await dbOrTx.insert(productDeviceCompatibility).values(
                compatibility.map((deviceId: string) => ({
                    productId: product.id,
                    deviceId
                }))
            );
        }
        return product;
    }

    async updateProduct(id: string, data: UpdateProductData, dbOrTx: any = db): Promise<ProductEntity> {
        const updateData: Partial<typeof products.$inferInsert> = { ...data };
        delete (updateData as any).compatibility;

        const result = await dbOrTx.update(products)
            .set(updateData)
            .where(eq(products.id, id))
            .returning();

        if (data.compatibility) {
            await dbOrTx.delete(productDeviceCompatibility).where(eq(productDeviceCompatibility.productId, id));

            if (data.compatibility.length > 0) {
                await dbOrTx.insert(productDeviceCompatibility).values(
                    data.compatibility.map((deviceId: string) => ({
                        productId: id,
                        deviceId
                    }))
                );
            }
        }

        return result[0];
    }

    async deleteProduct(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(products).where(eq(products.id, id));
    }

    async updateMinStockByCategory(categoryId: string, minStock: number, dbOrTx: any = db): Promise<number> {
        const result = await dbOrTx.update(products)
            .set({ minStock })
            .where(eq(products.categoryId, categoryId))
            .returning();
        return result.length;
    }

    async countByCategory(categoryId: string, dbOrTx: any = db): Promise<number> {
        const result = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.categoryId, categoryId));
        return Number(result[0]?.count || 0);
    }

    async getInventoryStats(dbOrTx: any = db): Promise<InventoryStats> {
        const [totalProducts] = await dbOrTx.select({ count: sql<number>`count(*)` }).from(products);
        const [lowStock] = await dbOrTx.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(sql`${products.stock} <= ${products.minStock}`);
        const [totalValue] = await dbOrTx.select({ value: sql<number>`sum(${productBatches.currentStock} * ${productBatches.buyPrice})` })
            .from(productBatches);
        const [totalCategories] = await dbOrTx.select({ count: sql<number>`count(*)` }).from(categories);

        return {
            totalProducts: Number(totalProducts?.count || 0),
            lowStock: Number(lowStock?.count || 0),
            totalValue: Number(totalValue?.value || 0),
            totalCategories: Number(totalCategories?.count || 0)
        };
    }

    async searchProductFlattened(search?: string, dbOrTx: any = db): Promise<SearchResult[]> {
        const conditions = [];
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            conditions.push(
                or(
                    ilike(products.name, term),
                    ilike(products.code, term),
                    ilike(productVariants.name, term),
                    ilike(productVariants.sku, term)
                )
            );
        }

        const query = dbOrTx
            .select({
                id: productVariants.id,
                productId: products.id,
                universalCode: products.code,
                productName: products.name,
                variantName: productVariants.name,
                categoryName: categories.name,
                sku: productVariants.sku,
                price: productVariants.defaultPrice,
                stock: products.stock
            })
            .from(productVariants)
            .innerJoin(products, eq(productVariants.productId, products.id))
            .leftJoin(categories, eq(products.categoryId, categories.id));

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const results = await query;

        return results.map((r: any) => ({
            ...r,
            displayName: r.variantName && r.variantName !== "Default" && r.variantName !== ""
                ? `${r.productName} (${r.variantName})`
                : r.productName,
            price: r.price || 0,
            stock: r.stock || 0
        }));
    }

    async getLastBatchByProduct(productId: string, dbOrTx: any = db): Promise<ProductBatchEntity | null> {
        const batch = await dbOrTx.query.productBatches.findFirst({
            where: eq(productBatches.productId, productId),
            orderBy: (b: any, { desc }: any) => [desc(b.createdAt)],
            with: { supplier: true }
        });
        return batch || null;
    }
}

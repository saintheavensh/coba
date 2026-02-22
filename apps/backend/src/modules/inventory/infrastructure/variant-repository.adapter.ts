/**
 * Drizzle-based variant repository adapter.
 * Implements IVariantRepository from the domain layer.
 */
import type { IVariantRepository } from "../domain/variant-repository.port";
import type { VariantEntity, CreateVariantData, UpdateVariantData } from "../domain/product.entity";
import { db } from "../../../db";
import { products, productVariants, categoryVariants } from "../../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export class VariantRepositoryAdapter implements IVariantRepository {
    async findVariantsBySupplierConfig(supplierId: string, dbOrTx: any = db): Promise<VariantEntity[]> {
        return await dbOrTx
            .select({
                id: categoryVariants.id,
                name: categoryVariants.name,
                categoryId: categoryVariants.categoryId
            })
            .from(categoryVariants)
            .where(eq(categoryVariants.supplierId, supplierId));
    }

    async findVariantsByProductId(productId: string, supplierId?: string, dbOrTx: any = db): Promise<VariantEntity[]> {
        const conditions = [eq(productVariants.productId, productId)];

        if (supplierId) {
            const product = await dbOrTx.query.products.findFirst({
                where: eq(products.id, productId),
                columns: { categoryId: true }
            });

            if (product && product.categoryId) {
                const allowedVariants = await dbOrTx.query.categoryVariants.findMany({
                    where: and(
                        eq(categoryVariants.supplierId, supplierId),
                        eq(categoryVariants.categoryId, product.categoryId)
                    ),
                    columns: { name: true }
                });

                const allowedNames = allowedVariants.map((v: any) => v.name);

                if (allowedNames.length > 0) {
                    conditions.push(inArray(productVariants.name, allowedNames));
                } else {
                    return [];
                }
            }
        }

        return await dbOrTx.query.productVariants.findMany({
            where: and(...conditions),
            orderBy: [desc(productVariants.createdAt)]
        });
    }

    async createVariant(data: CreateVariantData, dbOrTx: any = db): Promise<VariantEntity> {
        const result = await dbOrTx.insert(productVariants).values(data).returning();
        return result[0];
    }

    async updateVariant(id: string, data: UpdateVariantData, dbOrTx: any = db): Promise<VariantEntity> {
        const result = await dbOrTx.update(productVariants)
            .set(data)
            .where(eq(productVariants.id, id))
            .returning();
        return result[0];
    }

    async deleteVariant(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(productVariants).where(eq(productVariants.id, id));
    }
}

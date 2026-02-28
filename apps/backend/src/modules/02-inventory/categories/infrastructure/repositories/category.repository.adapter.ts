import { db } from "../../../../../shared/infrastructure/database/client";
import { categories, categoryVariants, products, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { eq, desc, asc, and, eq as eqFn } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";
import { DBContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class CategoryRepositoryAdapter implements ICategoryRepository {
    async findAll(dbOrTx: any = db): Promise<any[]> {
        return await dbOrTx.query.categories.findMany({
            orderBy: [desc(categories.name)],
            with: {
                variantTemplates: {
                    with: {
                        supplier: true
                    }
                }
            }
        });
    }

    async findById(id: string, dbOrTx: any = db): Promise<any | null> {
        return await dbOrTx.query.categories.findFirst({
            where: eq(categories.id, id),
            with: {
                variantTemplates: {
                    orderBy: [asc(categoryVariants.name)]
                }
            }
        });
    }

    async create(data: any, dbOrTx: any = db): Promise<any> {
        return await dbOrTx.insert(categories).values(data).returning();
    }

    async update(id: string, data: any, dbOrTx: any = db): Promise<any> {
        return await dbOrTx.update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(categories).where(eq(categories.id, id));
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx: any = db): Promise<any> {
        return await dbOrTx.insert(categoryVariants).values({
            categoryId,
            name,
            supplierId: supplierId || null
        }).returning();
    }

    async removeVariantTemplate(id: string, dbOrTx: any = db): Promise<void> {
        await dbOrTx.delete(categoryVariants).where(eq(categoryVariants.id, id));
    }

    async propagateVariantToProducts(categoryId: string, variantName: string, supplierId?: string, dbOrTx: any = db): Promise<void> {
        const productsInCategory = await dbOrTx.query.products.findMany({
            where: eq(products.categoryId, categoryId)
        });

        for (const product of productsInCategory) {
            const existingVariant = await dbOrTx.query.productVariants.findFirst({
                where: and(
                    eq(productVariants.productId, product.id),
                    eq(productVariants.name, variantName)
                )
            });

            if (!existingVariant) {
                await dbOrTx.insert(productVariants).values({
                    id: generateId(ID_PREFIX.VARIANT),
                    productId: product.id,
                    name: variantName
                });
            }
        }
    }
}

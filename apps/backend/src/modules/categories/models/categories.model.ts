import { db } from "../../../db";
import { categories, categoryVariants } from "../../../db/schema";
import { eq, desc, asc } from "drizzle-orm";

export class CategoriesModel {
    async findAll(dbOrTx: any = db) {
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

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.categories.findFirst({
            where: eq(categories.id, id),
            with: {
                variantTemplates: {
                    orderBy: [asc(categoryVariants.name)]
                }
            }
        });
    }

    async create(data: typeof categories.$inferInsert, dbOrTx: any = db) {
        return await dbOrTx.insert(categories).values(data).returning();
    }

    async update(id: string, data: Partial<typeof categories.$inferInsert>, dbOrTx: any = db) {
        return await dbOrTx.update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx: any = db) {
        return await dbOrTx.delete(categories).where(eq(categories.id, id));
    }

    // Template Variants
    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx: any = db) {
        return await dbOrTx.insert(categoryVariants).values({
            categoryId,
            name,
            supplierId: supplierId || null
        }).returning();
    }

    async removeVariantTemplate(id: number, dbOrTx: any = db) {
        return await dbOrTx.delete(categoryVariants).where(eq(categoryVariants.id, id));
    }

    async propagateVariantToProducts(categoryId: string, variantName: string, supplierId?: string, dbOrTx: any = db) {
        // Find all products in this category
        const { products, productVariants } = await import("../../../db/schema");
        const { generateId, ID_PREFIX } = await import("../../../lib/utils");

        const productsInCategory = await dbOrTx.query.products.findMany({
            where: eq(products.categoryId, categoryId)
        });

        // For each product, check if variant exists, if not, create it
        for (const product of productsInCategory) {
            const existingVariant = await dbOrTx.query.productVariants.findFirst({
                where: (pv: any, { and, eq: eqFn }: any) => and(
                    eqFn(pv.productId, product.id),
                    eqFn(pv.name, variantName)
                )
            });

            if (!existingVariant) {
                await dbOrTx.insert(productVariants).values({
                    id: generateId(ID_PREFIX.VARIANT),
                    productId: product.id,
                    name: variantName,
                    // Note: supplierId is tracked in categoryVariants, not productVariants
                });
            }
        }
    }
}

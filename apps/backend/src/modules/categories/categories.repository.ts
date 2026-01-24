import { db } from "../../db";
import { categories, categoryVariants } from "../../db/schema";
import { eq, desc, asc } from "drizzle-orm";

export class CategoriesRepository {
    async findAll() {
        return await db.query.categories.findMany({
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

    async findById(id: string) {
        return await db.query.categories.findFirst({
            where: eq(categories.id, id),
            with: {
                variantTemplates: {
                    orderBy: [asc(categoryVariants.name)]
                }
            }
        });
    }

    async create(data: typeof categories.$inferInsert) {
        return await db.insert(categories).values(data).returning();
    }

    async update(id: string, data: Partial<typeof categories.$inferInsert>) {
        return await db.update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(categories).where(eq(categories.id, id));
    }

    // Template Variants
    async addVariantTemplate(categoryId: string, name: string, supplierId?: string) {
        return await db.insert(categoryVariants).values({
            categoryId,
            name,
            supplierId: supplierId || null
        }).returning();
    }

    async removeVariantTemplate(id: number) {
        return await db.delete(categoryVariants).where(eq(categoryVariants.id, id));
    }

    async propagateVariantToProducts(categoryId: string, variantName: string, supplierId?: string) {
        // Find all products in this category
        const { products, productVariants } = await import("../../db/schema");
        const { generateId, ID_PREFIX } = await import("../../lib/utils");

        const productsInCategory = await db.query.products.findMany({
            where: eq(products.categoryId, categoryId)
        });

        // For each product, check if variant exists, if not, create it
        for (const product of productsInCategory) {
            const existingVariant = await db.query.productVariants.findFirst({
                where: (pv, { and, eq: eqFn }) => and(
                    eqFn(pv.productId, product.id),
                    eqFn(pv.name, variantName)
                )
            });

            if (!existingVariant) {
                await db.insert(productVariants).values({
                    id: generateId(ID_PREFIX.VARIANT),
                    productId: product.id,
                    name: variantName,
                    // Note: supplierId is tracked in categoryVariants, not productVariants
                });
            }
        }
    }
}

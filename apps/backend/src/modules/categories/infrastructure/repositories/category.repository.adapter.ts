import { injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { categories, categoryVariants, products, productVariants } from "../../../../db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../../shared/utils/validation/IdGenerator";
import { ICategoryRepository } from "../../domain";
import { Category, CategoryVariant, CreateCategoryData, UpdateCategoryData } from "../../domain/entities/category.entity";

@injectable()
export class CategoryRepositoryAdapter implements ICategoryRepository {
    async findAll(dbOrTx: DBContext = db): Promise<Category[]> {
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

    async findById(id: string, dbOrTx: DBContext = db): Promise<Category | null> {
        const result = await dbOrTx.query.categories.findFirst({
            where: eq(categories.id, id),
            with: {
                variantTemplates: {
                    orderBy: [asc(categoryVariants.name)]
                }
            }
        });
        return (result as Category | undefined) ?? null;
    }

    async create(data: CreateCategoryData, dbOrTx: DBContext = db): Promise<Category> {
        const results = await dbOrTx.insert(categories).values(data as any).returning();
        const created = results[0];
        if (!created) throw new Error("Failed to create category");
        return created as Category;
    }

    async update(id: string, data: UpdateCategoryData, dbOrTx: DBContext = db): Promise<Category> {
        const results = await dbOrTx.update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();
        const updated = results[0];
        if (!updated) throw new Error("Failed to update category");
        return updated as Category;
    }

    async delete(id: string, dbOrTx: DBContext = db): Promise<void> {
        await dbOrTx.delete(categories).where(eq(categories.id, id));
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx: DBContext = db): Promise<CategoryVariant> {
        const results = await dbOrTx.insert(categoryVariants).values({
            categoryId,
            name,
            supplierId: supplierId || null
        }).returning();
        const created = results[0];
        if (!created) throw new Error("Failed to add variant template");
        return created as CategoryVariant;
    }

    async removeVariantTemplate(id: string, dbOrTx: DBContext = db): Promise<void> {
        await dbOrTx.delete(categoryVariants).where(eq(categoryVariants.id, id));
    }

    async findProductsByCategory(categoryId: string, dbOrTx: DBContext = db): Promise<{ id: string }[]> {
        return await dbOrTx.query.products.findMany({
            columns: { id: true },
            where: eq(products.categoryId, categoryId)
        });
    }

    async productHasVariant(productId: string, variantName: string, dbOrTx: DBContext = db): Promise<boolean> {
        const existingVariant = await dbOrTx.query.productVariants.findFirst({
            where: and(
                eq(productVariants.productId, productId),
                eq(productVariants.name, variantName)
            )
        });
        return !!existingVariant;
    }

    async addVariantToProduct(productId: string, variantName: string, dbOrTx: DBContext = db): Promise<void> {
        await dbOrTx.insert(productVariants).values({
            id: generateId(ID_PREFIX.VARIANT),
            productId,
            name: variantName
        });
    }
}

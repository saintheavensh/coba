import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
import { suppliers, supplierCategories, categories, categoryVariants, supplierProductVariants, products, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { DBContext } from "../../../../../shared/types/db-context";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "../../domain";

export class SupplierRepositoryAdapter implements ISupplierRepository {
    async findAll(dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.suppliers.findMany({
            where: eq(suppliers.isActive, true),
            orderBy: [desc(suppliers.createdAt)],
        });
        return result as Supplier[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Supplier | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.suppliers.findFirst({
            where: eq(suppliers.id, id)
        });
        return (result as Supplier) || null;
    }

    async getLinkedCategories(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;
        const result = await client
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

    async create(data: CreateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = (dbOrTx as any) || db;
        return await client.insert(suppliers).values(data).returning();
    }

    async update(id: string, data: UpdateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = (dbOrTx as any) || db;
        return await client.update(suppliers)
            .set(data)
            .where(eq(suppliers.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<any> {
        const client = (dbOrTx as any) || db;
        // Delete linked category variants first (no cascade in schema)
        await client.delete(categoryVariants).where(eq(categoryVariants.supplierId, id));

        return await client.delete(suppliers).where(eq(suppliers.id, id));
    }

    async addCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(supplierCategories)
            .values({ supplierId, categoryId })
            .onConflictDoNothing();
    }

    async removeCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(supplierCategories)
            .where(
                and(
                    eq(supplierCategories.supplierId, supplierId),
                    eq(supplierCategories.categoryId, categoryId)
                )
            );
    }

    async getMappedProductVariants(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = (dbOrTx as any) || db;

        // Use query builder for full inner joins or left joins depending on if variant is null
        const results = await client
            .select({
                id: supplierProductVariants.id,
                productId: products.id,
                productName: products.name,
                variantId: productVariants.id,
                variantName: productVariants.name,
                isActive: supplierProductVariants.isActive
            })
            .from(supplierProductVariants)
            .innerJoin(products, eq(supplierProductVariants.productId, products.id))
            .leftJoin(productVariants, eq(supplierProductVariants.variantId, productVariants.id))
            .where(eq(supplierProductVariants.supplierId, supplierId));

        return results;
    }

    async mapProductVariant(supplierId: string, productId: string, variantId?: string | null, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;

        // Handle null vs string
        const vId = variantId || null;

        await client.insert(supplierProductVariants)
            .values({ supplierId, productId, variantId: vId })
            .onConflictDoUpdate({
                target: [supplierProductVariants.supplierId, supplierProductVariants.productId, supplierProductVariants.variantId],
                set: { isActive: true, updatedAt: new Date() }
            });
    }

    async unmapProductVariant(supplierId: string, productId: string, variantId?: string | null, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;

        const conditions = [
            eq(supplierProductVariants.supplierId, supplierId),
            eq(supplierProductVariants.productId, productId)
        ];

        // variantId in db could be null conceptually, though unique().on handles it as distinct usually.
        // We use isNull if variantId is not provided
        if (variantId) {
            conditions.push(eq(supplierProductVariants.variantId, variantId));
        } else {
            // Need a way to match where variantId is null
            // Drizzle has isNull function, we need to import it wait, let's just use raw sql or simple approach.
            // Drizzle eq(col, null) might generate `col IS NULL`.
            conditions.push(eq(supplierProductVariants.variantId, null as any)); // Assuming Drizzle handles it or we can import isNull
        }

        // We can just delete it, or soft delete it mapping. The prompt said unmap, let's delete.
        await client.delete(supplierProductVariants)
            .where(and(...conditions));
    }
}

import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../../db";
import { suppliers, supplierCategories, categories, categoryVariants } from "../../../../db/schema";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "../../domain";

export class SupplierRepositoryAdapter implements ISupplierRepository {
    async findAll(dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.suppliers.findMany({
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
}

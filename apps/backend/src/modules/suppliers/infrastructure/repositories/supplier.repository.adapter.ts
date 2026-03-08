import { eq, desc, and, isNull } from "drizzle-orm";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../../types";
import { DrizzleClient } from "../../../../shared/infrastructure/database/DrizzleClient";
import { suppliers, supplierCategories, categories, categoryVariants, supplierProductVariants, products, productVariants } from "../../../../db/schema";
import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "../../domain";

@injectable()
export class SupplierRepositoryAdapter implements ISupplierRepository {
    constructor(
        @inject(TYPES.DrizzleClient) private readonly dbClient: DrizzleClient
    ) { }

    async findAll(dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = dbOrTx || this.dbClient.getClient();
        const result = await client.query.suppliers.findMany({
            orderBy: [desc(suppliers.createdAt)],
        });
        return result as Supplier[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Supplier | null> {
        const client = dbOrTx || this.dbClient.getClient();
        const result = await client.query.suppliers.findFirst({
            where: eq(suppliers.id, id)
        });
        return (result as Supplier) || null;
    }

    async getLinkedCategories(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = dbOrTx || this.dbClient.getClient();
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
        const client = dbOrTx || this.dbClient.getClient();
        return await client.insert(suppliers).values(data).returning();
    }

    async update(id: string, data: UpdateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]> {
        const client = dbOrTx || this.dbClient.getClient();
        return await client.update(suppliers)
            .set(data)
            .where(eq(suppliers.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();
        // Delete linked category variants first (no cascade in schema)
        await client.delete(categoryVariants).where(eq(categoryVariants.supplierId, id));

        await client.delete(suppliers).where(eq(suppliers.id, id));
    }

    async addCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();
        await client.insert(supplierCategories)
            .values({ supplierId, categoryId })
            .onConflictDoNothing();
    }

    async removeCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();
        await client.delete(supplierCategories)
            .where(
                and(
                    eq(supplierCategories.supplierId, supplierId),
                    eq(supplierCategories.categoryId, categoryId)
                )
            );
    }

    async getMappedProductVariants(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        const client = dbOrTx || this.dbClient.getClient();

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
        const client = dbOrTx || this.dbClient.getClient();

        const vId = variantId || null;

        await client.insert(supplierProductVariants)
            .values({ supplierId, productId, variantId: vId })
            .onConflictDoUpdate({
                target: [supplierProductVariants.supplierId, supplierProductVariants.productId, supplierProductVariants.variantId],
                set: { isActive: true }
            });
    }

    async unmapProductVariant(supplierId: string, productId: string, variantId?: string | null, dbOrTx?: DBContext): Promise<void> {
        const client = dbOrTx || this.dbClient.getClient();

        const conditions = [
            eq(supplierProductVariants.supplierId, supplierId),
            eq(supplierProductVariants.productId, productId)
        ];

        if (variantId) {
            conditions.push(eq(supplierProductVariants.variantId, variantId));
        } else {
            conditions.push(isNull(supplierProductVariants.variantId));
        }

        await client.delete(supplierProductVariants)
            .where(and(...conditions));
    }
}

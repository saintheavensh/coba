import { inject, injectable } from "inversify";
import { eq, sql } from "drizzle-orm";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { Status } from "../../domain/value-objects/ProductStatus.vo";
import { Result } from "../../../../shared/core/Result";
import { ProductMapper } from "../../application/mappers/ProductMapper";
import { products } from "../schema/ProductSchema";
import { DrizzleClient } from "../../../../shared/infrastructure/database/DrizzleClient";

/**
 * DrizzleProductRepository
 * PostgreSQL implementation of the product repository using Drizzle ORM.
 */
@injectable()
export class DrizzleProductRepository implements IProductRepository {
    constructor(
        @inject(TYPES.DrizzleClient) private drizzleClient: DrizzleClient
    ) { }

    public async findById(id: string, dbOrTx?: any): Promise<Result<Product>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client.select().from(products).where(eq(products.id, id));
            if (rows.length === 0) {
                return Result.fail(`Product with id ${id} not found`);
            }
            return ProductMapper.toDomain(rows[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findBySku(sku: Sku, dbOrTx?: any): Promise<Result<Product>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client.select().from(products).where(eq(products.code, sku.value));
            if (rows.length === 0) {
                return Result.fail(`Product with sku ${sku.value} not found`);
            }
            return ProductMapper.toDomain(rows[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async save(product: Product, dbOrTx?: any): Promise<Result<void>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        const row = ProductMapper.toPersistence(product);

        try {
            await client.insert(products).values(row)
                .onConflictDoUpdate({
                    target: products.id,
                    set: {
                        code: row.sku,
                        name: row.name,
                        categoryId: row.categoryId,
                        updatedAt: new Date()
                    }
                });

            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async delete(id: string, dbOrTx?: any): Promise<Result<boolean>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const result = await client.delete(products).where(eq(products.id, id));
            // result.rowCount might not be directly available depending on drizzle driver, 
            // but for pg it usually is.
            return Result.ok(true);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    public async findActive(dbOrTx?: any): Promise<Result<Product[]>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client.select().from(products);

            const productEntities: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    productEntities.push(productResult.getValue());
                }
            }
            return Result.ok(productEntities);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }
}

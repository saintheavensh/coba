import { inject, injectable } from "inversify";
import { eq, sql, ilike, or } from "drizzle-orm";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Product } from "../../domain/entities/Product.entity";
import { Sku } from "../../domain/value-objects/Sku.vo";

import { Result } from "../../../../shared/core/Result";
import { ProductMapper } from "../../application/mappers/ProductMapper";
import { products } from "../schema/ProductSchema";
import { productBatches } from "../../../inventory/infrastructure/schema/BatchSchema";
import { DrizzleClient } from "../../../../shared/infrastructure/database/DrizzleClient";
import { Pagination, PaginationParams, PaginatedResult } from "../../../../shared/application/pagination/Pagination";
import { DBContext } from "../../../../shared/types/db-context";

/**
 * DrizzleProductRepository
 * PostgreSQL implementation of the product repository using Drizzle ORM.
 */
@injectable()
export class DrizzleProductRepository implements IProductRepository {
    constructor(
        @inject(TYPES.DrizzleClient) private drizzleClient: DrizzleClient
    ) { }

    public async findById(id: string, dbOrTx?: DBContext): Promise<Result<Product>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.id, id))
                .groupBy(products.id);

            const row = rows[0];
            if (!row) {
                return Result.fail(`Product with id ${id} not found`);
            }
            return ProductMapper.toDomain(row);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Database error: ${message}`);
        }
    }

    public async findBySku(sku: Sku, dbOrTx?: DBContext): Promise<Result<Product>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.code, sku.value))
                .groupBy(products.id);

            const row = rows[0];
            if (!row) {
                return Result.fail(`Product with sku ${sku.value} not found`);
            }
            return ProductMapper.toDomain(row);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Database error: ${message}`);
        }
    }

    public async save(product: Product, dbOrTx?: DBContext): Promise<Result<void>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        const row = ProductMapper.toPersistence(product);

        try {
            await client.insert(products).values(row)
                .onConflictDoUpdate({
                    target: products.id,
                    set: {
                        code: row.code,
                        name: row.name,
                        categoryId: row.categoryId,
                        updatedAt: new Date()
                    }
                });

            return Result.ok();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Database error: ${message}`);
        }
    }

    public async delete(id: string, dbOrTx?: DBContext): Promise<Result<boolean>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            await client.delete(products).where(eq(products.id, id));
            return Result.ok(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Database error: ${message}`);
        }
    }

    public async findActive(dbOrTx?: DBContext): Promise<Result<Product[]>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        try {
            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .groupBy(products.id);

            const productEntities: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    productEntities.push(productResult.getValue());
                }
            }
            return Result.ok(productEntities);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Database error: ${message}`);
        }
    }

    public async findAllPaginated(params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const countResult = await client.select({ count: sql<number>`count(*)` }).from(products);
            const total = Number(countResult[0]?.count ?? 0);

            const sortField = pagination.sortBy as keyof typeof products;
            const sortColumn = (products as Record<string, any>)[sortField] || products.createdAt;

            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortColumn
                        : sql`${sortColumn} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Failed to fetch paginated products: ${message}`);
        }
    }

    public async findByCategoryPaginated(categoryId: string, params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const countResult = await client.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, categoryId));
            const total = Number(countResult[0]?.count ?? 0);

            const sortField = pagination.sortBy as keyof typeof products;
            const sortColumn = (products as Record<string, any>)[sortField] || products.createdAt;

            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(eq(products.categoryId, categoryId))
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortColumn
                        : sql`${sortColumn} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Failed to fetch category products: ${message}`);
        }
    }

    public async searchProducts(query: string, params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>> {
        const client = dbOrTx || this.drizzleClient.getClient();
        const pagination = Pagination.fromQuery(params);
        const sqlParams = Pagination.toSql(pagination);

        try {
            const searchCondition = or(
                ilike(products.name, `%${query}%`),
                ilike(products.code, `%${query}%`)
            );

            const countResult = await client.select({ count: sql<number>`count(*)` }).from(products).where(searchCondition!);
            const total = Number(countResult[0]?.count ?? 0);

            const sortField = pagination.sortBy as keyof typeof products;
            const sortColumn = (products as Record<string, any>)[sortField] || products.createdAt;

            const rows = await client
                .select({
                    id: products.id,
                    code: products.code,
                    name: products.name,
                    price: sql<number>`COALESCE(MAX(${productBatches.sellPrice}), 0)`.mapWith(Number),
                    categoryId: products.categoryId,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                    stock: sql<number>`COALESCE(SUM(${productBatches.currentStock}), 0)`.mapWith(Number)
                })
                .from(products)
                .leftJoin(productBatches, eq(products.id, productBatches.productId))
                .where(searchCondition!)
                .groupBy(products.id)
                .limit(sqlParams.limit)
                .offset(sqlParams.offset)
                .orderBy(
                    pagination.sortOrder === 'asc'
                        ? sortColumn
                        : sql`${sortColumn} DESC`
                );

            const domainProducts: Product[] = [];
            for (const row of rows) {
                const productResult = ProductMapper.toDomain(row);
                if (productResult.isSuccess) {
                    domainProducts.push(productResult.getValue());
                }
            }

            const result = Pagination.createResult(domainProducts, total, pagination);
            return Result.ok(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(`Failed to search products: ${message}`);
        }
    }
}

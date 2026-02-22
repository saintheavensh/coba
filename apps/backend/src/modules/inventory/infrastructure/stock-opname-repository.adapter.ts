/**
 * Drizzle-based stock opname repository adapter.
 * Implements IStockOpnameRepository from the domain layer.
 */
import type {
    IStockOpnameRepository,
    OpnameSessionEntity,
    OpnameItemEntity,
    OpnameBatchEntity,
    AdjustmentHistoryRow,
    InsertSessionData,
    InsertItemData
} from "../domain/stock-opname-repository.port";
import { db } from "../../../db";
import {
    stockOpnameSessions,
    stockOpnameItems,
    productBatches,
    products,
    productVariants
} from "../../../db/schema";
import { eq, and, sql, asc, desc, isNull } from "drizzle-orm";

export class StockOpnameRepositoryAdapter implements IStockOpnameRepository {

    async transaction<T>(fn: (tx: unknown) => Promise<T>, dbOrTx: any = db): Promise<T> {
        return await dbOrTx.transaction(fn);
    }

    async insertSession(data: InsertSessionData, dbOrTx: any = db): Promise<void> {
        await dbOrTx.insert(stockOpnameSessions).values({
            id: data.id,
            userId: data.userId,
            notes: data.notes,
            status: data.status
        });
    }

    async updateSessionStatus(id: string, status: string, completedAt?: Date, dbOrTx: any = db): Promise<void> {
        const setData: any = { status };
        if (completedAt) setData.completedAt = completedAt;
        await dbOrTx.update(stockOpnameSessions).set(setData).where(eq(stockOpnameSessions.id, id));
    }

    async insertItems(items: InsertItemData[], dbOrTx: any = db): Promise<void> {
        await dbOrTx.insert(stockOpnameItems).values(items);
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string, dbOrTx: any = db): Promise<OpnameItemEntity | null> {
        const item = await dbOrTx.query.stockOpnameItems.findFirst({
            where: eq(stockOpnameItems.id, String(itemId))
        });
        if (!item) return null;

        await dbOrTx.update(stockOpnameItems).set({
            physicalStock,
            adjustmentReason: reason
        }).where(eq(stockOpnameItems.id, String(itemId)));

        const difference = physicalStock - item.systemStock;
        return {
            id: item.id,
            sessionId: item.sessionId,
            productId: item.productId,
            variantName: item.variantName,
            systemStock: item.systemStock,
            physicalStock,
            adjustmentReason: reason,
            difference
        };
    }

    async findSessions(dbOrTx: any = db): Promise<OpnameSessionEntity[]> {
        return await dbOrTx.query.stockOpnameSessions.findMany({
            with: { user: true },
            orderBy: (s: any, { desc }: any) => [desc(s.createdAt)]
        });
    }

    async findSessionById(id: string, dbOrTx: any = db): Promise<OpnameSessionEntity | null> {
        const sessionArr = await dbOrTx.select().from(stockOpnameSessions).where(eq(stockOpnameSessions.id, id));
        if (sessionArr.length === 0) return null;
        return sessionArr[0];
    }

    async findItemsBySession(sessionId: string, dbOrTx: any = db): Promise<OpnameItemEntity[]> {
        const items = await dbOrTx.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            adjustmentReason: stockOpnameItems.adjustmentReason,
            product: products
        })
            .from(stockOpnameItems)
            .leftJoin(products, eq(stockOpnameItems.productId, products.id))
            .where(eq(stockOpnameItems.sessionId, sessionId));

        return items.map((i: any) => ({
            ...i,
            difference: i.physicalStock !== null ? (i.physicalStock - i.systemStock) : 0,
            product: i.product
        }));
    }

    async findProductIdsByCategory(categoryId: string, dbOrTx: any = db): Promise<string[]> {
        const productList = await dbOrTx.select({ id: products.id })
            .from(products)
            .where(eq(products.categoryId, categoryId));
        return productList.map((p: any) => p.id);
    }

    async findAllBatches(productIds?: string[], dbOrTx: any = db): Promise<OpnameBatchEntity[]> {
        if (productIds && productIds.length > 0) {
            return await dbOrTx.query.productBatches.findMany({
                where: (b: any, { inArray }: any) => inArray(b.productId, productIds)
            });
        }
        return await dbOrTx.query.productBatches.findMany();
    }

    async findBatchesByProductAndVariant(
        productId: string,
        variantName: string | null,
        dbOrTx: any = db
    ): Promise<OpnameBatchEntity[]> {
        let targetVariantId: string | null = null;
        if (variantName) {
            const vQuery = await dbOrTx.select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.productId, productId),
                    eq(productVariants.name, variantName)
                ));
            if (vQuery.length > 0) targetVariantId = vQuery[0].id;
        }

        return await dbOrTx.select().from(productBatches).where(
            and(
                eq(productBatches.productId, productId),
                targetVariantId
                    ? eq(productBatches.variantId, targetVariantId)
                    : isNull(productBatches.variantId)
            )
        ).orderBy(asc(productBatches.createdAt));
    }

    async resolveVariantId(productId: string, variantName: string, dbOrTx: any = db): Promise<string | null> {
        const vQuery = await dbOrTx.select({ id: productVariants.id })
            .from(productVariants)
            .where(and(
                eq(productVariants.productId, productId),
                eq(productVariants.name, variantName)
            ));
        return vQuery.length > 0 ? vQuery[0].id : null;
    }

    async updateBatchStock(batchId: string, newStock: number, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(productBatches).set({
            currentStock: newStock,
            updatedAt: new Date()
        }).where(eq(productBatches.id, batchId));
    }

    async updateProductStockDelta(productId: string, delta: number, dbOrTx: any = db): Promise<void> {
        await dbOrTx.update(products).set({
            stock: sql`${products.stock} + ${delta}`
        }).where(eq(products.id, productId));
    }

    async getAdjustmentHistoryRows(dbOrTx: any = db): Promise<AdjustmentHistoryRow[]> {
        const usersMap = await dbOrTx.query.users.findMany().then((rows: any[]) => {
            const map: Record<string, string> = {};
            rows.forEach((r: any) => map[r.id] = r.name);
            return map;
        });

        const rows = await dbOrTx.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            productName: products.name,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            difference: sql<number>`(${stockOpnameItems.physicalStock} - ${stockOpnameItems.systemStock})`,
            reason: stockOpnameItems.adjustmentReason,
            completedAt: stockOpnameSessions.completedAt,
            userId: stockOpnameSessions.userId
        })
            .from(stockOpnameItems)
            .innerJoin(stockOpnameSessions, eq(stockOpnameItems.sessionId, stockOpnameSessions.id))
            .innerJoin(products, eq(stockOpnameItems.productId, products.id))
            .where(
                and(
                    eq(stockOpnameSessions.status, "completed"),
                    sql`${stockOpnameItems.physicalStock} != ${stockOpnameItems.systemStock}`
                )
            )
            .orderBy(desc(stockOpnameSessions.completedAt));

        return rows.map((r: any) => ({
            ...r,
            userName: usersMap[r.userId as any] || "Unknown"
        }));
    }
}

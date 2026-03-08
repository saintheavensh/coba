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
} from "../../domain/stock-opname-repository.port";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import {
    stockOpnameSessions,
    stockOpnameItems,
    productBatches,
    products,
    productVariants,
    users
} from "../../../../db/schema";
import { eq, and, sql, asc, desc, isNull } from "drizzle-orm";

export class StockOpnameRepositoryAdapter implements IStockOpnameRepository {

    async transaction<T>(fn: (tx: DBContext) => Promise<T>, dbOrTx: DBContext = db): Promise<T> {
        return await (dbOrTx || db).transaction(fn);
    }

    async insertSession(data: InsertSessionData, dbOrTx: DBContext = db): Promise<void> {
        await (dbOrTx || db).insert(stockOpnameSessions).values({
            id: data.id,
            userId: data.userId,
            notes: data.notes,
            status: data.status as "draft" | "completed" | "cancelled"
        });
    }

    async updateSessionStatus(id: string, status: string, completedAt?: Date, dbOrTx: DBContext = db): Promise<void> {
        const setData: any = { status: status as "draft" | "completed" | "cancelled" };
        if (completedAt) setData.completedAt = completedAt;
        await (dbOrTx || db).update(stockOpnameSessions).set(setData).where(eq(stockOpnameSessions.id, id));
    }

    async insertItems(items: InsertItemData[], dbOrTx: DBContext = db): Promise<void> {
        await (dbOrTx || db).insert(stockOpnameItems).values(items);
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string, dbOrTx: DBContext = db): Promise<OpnameItemEntity | null> {
        const item = await (dbOrTx || db).query.stockOpnameItems.findFirst({
            where: eq(stockOpnameItems.id, String(itemId))
        });
        if (!item) return null;

        await (dbOrTx || db).update(stockOpnameItems).set({
            physicalStock,
            adjustmentReason: reason
        }).where(eq(stockOpnameItems.id, String(itemId)));

        const difference = physicalStock - item.systemStock;
        return {
            id: Number(item.id),
            sessionId: item.sessionId as string,
            productId: item.productId as string,
            variantName: item.variantName as string,
            systemStock: item.systemStock,
            physicalStock,
            adjustmentReason: reason,
            difference
        };
    }

    async findSessions(dbOrTx: DBContext = db): Promise<OpnameSessionEntity[]> {
        const results = await dbOrTx.query.stockOpnameSessions.findMany({
            with: { creator: true }, // Changed from 'user' to 'creator' per schema
            orderBy: (s, { desc }) => [desc(s.createdAt)]
        });

        return results.map(s => ({
            ...s,
            status: s.status || "draft",
            user: s.creator
        })) as OpnameSessionEntity[];
    }

    async findSessionById(id: string, dbOrTx: DBContext = db): Promise<OpnameSessionEntity | null> {
        const session = await dbOrTx.query.stockOpnameSessions.findFirst({
            where: eq(stockOpnameSessions.id, id),
            with: { creator: true }
        });
        if (!session) return null;
        return {
            ...session,
            status: session.status || "draft",
            user: session.creator
        } as OpnameSessionEntity;
    }

    async findItemsBySession(sessionId: string, dbOrTx: DBContext = db): Promise<OpnameItemEntity[]> {
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
            id: Number(i.id),
            sessionId: i.sessionId,
            productId: i.productId,
            variantName: i.variantName,
            systemStock: i.systemStock,
            physicalStock: i.physicalStock,
            adjustmentReason: i.adjustmentReason,
            difference: i.physicalStock !== null ? (i.physicalStock - i.systemStock) : 0,
            product: i.product
        }));
    }

    async findProductIdsByCategory(categoryId: string, dbOrTx: DBContext = db): Promise<string[]> {
        const productList = await dbOrTx.select({ id: products.id })
            .from(products)
            .where(eq(products.categoryId, categoryId));
        return productList.map((p: any) => p.id);
    }

    async findAllBatches(productIds?: string[], dbOrTx: DBContext = db): Promise<OpnameBatchEntity[]> {
        let results;
        if (productIds && productIds.length > 0) {
            results = await dbOrTx.query.productBatches.findMany({
                where: (b, { inArray }) => inArray(b.productId, productIds)
            });
        } else {
            results = await dbOrTx.query.productBatches.findMany();
        }

        return results.map(b => ({
            ...b,
            id: b.id as string,
            productId: b.productId as string,
            variantId: b.variantId as string | null,
            buyPrice: b.buyPrice,
            currentStock: b.currentStock,
            createdAt: b.createdAt || undefined
        })) as OpnameBatchEntity[];
    }

    async findBatchesByProductAndVariant(
        productId: string,
        variantName: string | null,
        dbOrTx: DBContext = db
    ): Promise<OpnameBatchEntity[]> {
        let targetVariantId: string | null = null;
        if (variantName) {
            const vQuery = await dbOrTx.select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.productId, productId),
                    eq(productVariants.name, variantName)
                ));
            if (vQuery.length > 0) targetVariantId = vQuery[0]!.id;
        }

        const results = await dbOrTx.select().from(productBatches).where(
            and(
                eq(productBatches.productId, productId),
                targetVariantId
                    ? eq(productBatches.variantId, targetVariantId)
                    : isNull(productBatches.variantId)
            )
        ).orderBy(asc(productBatches.createdAt));

        return results.map(b => ({
            ...b,
            id: b.id as string,
            productId: b.productId as string,
            variantId: b.variantId as string | null,
            buyPrice: b.buyPrice,
            currentStock: b.currentStock,
            createdAt: b.createdAt || undefined
        })) as OpnameBatchEntity[];
    }

    async resolveVariantId(productId: string, variantName: string, dbOrTx: DBContext = db): Promise<string | null> {
        const vQuery = await dbOrTx.select({ id: productVariants.id })
            .from(productVariants)
            .where(and(
                eq(productVariants.productId, productId),
                eq(productVariants.name, variantName)
            ));
        return vQuery.length > 0 ? vQuery[0]!.id : null;
    }

    async updateBatchStock(batchId: string, newStock: number, dbOrTx: DBContext = db): Promise<void> {
        await dbOrTx.update(productBatches).set({
            currentStock: newStock,
            updatedAt: new Date()
        }).where(eq(productBatches.id, batchId));
    }

    async updateProductStockDelta(productId: string, delta: number, dbOrTx: DBContext = db): Promise<void> {
        await dbOrTx.update(products).set({
            stock: sql`${products.stock} + ${delta}`
        }).where(eq(products.id, productId));
    }

    async getAdjustmentHistoryRows(dbOrTx: DBContext = db): Promise<AdjustmentHistoryRow[]> {
        const rows = await dbOrTx.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            productName: products.name,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            reason: stockOpnameItems.adjustmentReason,
            completedAt: stockOpnameSessions.completedAt,
            userId: stockOpnameSessions.userId,
            userName: users.name
        })
            .from(stockOpnameItems)
            .innerJoin(stockOpnameSessions, eq(stockOpnameItems.sessionId, stockOpnameSessions.id))
            .innerJoin(products, eq(stockOpnameItems.productId, products.id))
            .leftJoin(users, eq(stockOpnameSessions.userId, users.id))
            .where(
                and(
                    eq(stockOpnameSessions.status, "completed"),
                    sql`${stockOpnameItems.physicalStock} != ${stockOpnameItems.systemStock}`
                )
            )
            .orderBy(desc(stockOpnameSessions.completedAt));

        return rows.map((r: any) => ({
            ...r,
            id: Number(r.id),
            sessionId: r.sessionId as string,
            productId: r.productId as string,
            productName: r.productName as string,
            variantName: r.variantName as string,
            difference: r.physicalStock !== null ? (r.physicalStock - r.systemStock) : 0,
            userName: r.userName || "Unknown"
        }));
    }
}

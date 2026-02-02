import { db } from "../../../db";
import { stockOpnameSessions, stockOpnameItems, productBatches, products, productVariants } from "../../../db/schema";
import { eq, and, sql, asc, desc, or, isNull } from "drizzle-orm";
import { ActivityLogService } from "../../../lib/activity-log.service";

export class StockOpnameService {
    async createSession(userId: string, notes?: string, categoryId?: string, dbOrTx?: any) {
        const sessionId = `SO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            await tx.insert(stockOpnameSessions).values({
                id: sessionId,
                userId,
                notes,
                status: "draft"
            });

            // Fetch batches based on category filter
            if (categoryId) {
                const productList = await tx.select({ id: products.id })
                    .from(products)
                    .where(eq(products.categoryId, categoryId));
                const productIds = productList.map((p: any) => p.id);

                if (productIds.length === 0) return; // No products in category

                const batches = await tx.query.productBatches.findMany({
                    where: (b: any, { inArray }: any) => inArray(b.productId, productIds)
                });
                await this.populateGroupedItems(tx, sessionId, batches);
            } else {
                const batches = await tx.query.productBatches.findMany();
                await this.populateGroupedItems(tx, sessionId, batches);
            }
        });

        await ActivityLogService.log({
            userId,
            action: "CREATE",
            entityType: "stock_opname",
            entityId: sessionId,
            description: `Started new stock opname session ${sessionId}`
        }, effectiveDb);

        return sessionId;
    }

    private async populateGroupedItems(tx: any, sessionId: string, batches: any[]) {
        // Group by productId + variant string
        const groups: Record<string, { productId: string, variant: string | null, systemStock: number }> = {};

        for (const b of batches) {
            const key = `${b.productId}-${b.variant || 'default'}`;
            if (!groups[key]) {
                groups[key] = {
                    productId: b.productId,
                    variant: b.variant,
                    systemStock: 0
                };
            }
            groups[key].systemStock += b.currentStock;
        }

        for (const key in groups) {
            const g = groups[key];
            await tx.insert(stockOpnameItems).values({
                sessionId,
                productId: g.productId,
                variantName: g.variant || "Standard",
                systemStock: g.systemStock,
            });
        }
    }

    async getSessions(dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        return await effectiveDb.query.stockOpnameSessions.findMany({
            with: { user: true },
            orderBy: (s: any, { desc }: any) => [desc(s.createdAt)]
        });
    }

    async getSessionDetails(id: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        // Use simple select instead of Relational API to avoid potential proxy issues
        const sessionArr = await effectiveDb.select().from(stockOpnameSessions).where(eq(stockOpnameSessions.id, id));
        if (sessionArr.length === 0) return null;
        const session = sessionArr[0];

        // Fetch items with product details
        const items = await effectiveDb.select({
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
            .where(eq(stockOpnameItems.sessionId, id));

        // Calculate difference on the fly
        const itemsWithDiff = items.map((i: any) => ({
            ...i,
            difference: i.physicalStock !== null ? (i.physicalStock - i.systemStock) : 0,
            product: i.product
        }));

        return { ...session, items: itemsWithDiff };
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const item = await effectiveDb.query.stockOpnameItems.findFirst({
            where: eq(stockOpnameItems.id, itemId)
        });
        if (!item) throw new Error("Item not found");

        await effectiveDb.update(stockOpnameItems).set({
            physicalStock,
            adjustmentReason: reason
        }).where(eq(stockOpnameItems.id, itemId));

        const difference = physicalStock - item.systemStock;
        return { difference };
    }

    async finalizeSession(id: string, userId: string, dbOrTx?: any) {
        const session = await this.getSessionDetails(id, dbOrTx);
        if (!session) throw new Error("Session not found");
        if (session.status !== "draft") throw new Error("Only draft sessions can be finalized");

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            for (const item of session.items) {
                if (item.physicalStock === null) continue; // Skip items that weren't counted

                const difference = item.difference;

                if (difference !== 0) {
                    // FIFO Adjustment Logic
                    let targetVariantId: string | null = null;
                    if (item.variantName && item.variantName !== "Standard") {
                        const vQuery = await tx.select({ id: productVariants.id })
                            .from(productVariants)
                            .where(and(
                                eq(productVariants.productId, item.productId),
                                eq(productVariants.name, item.variantName)
                            ));
                        if (vQuery.length > 0) targetVariantId = vQuery[0].id;
                    }

                    const batches = await tx.select().from(productBatches).where(
                        and(
                            eq(productBatches.productId, item.productId),
                            targetVariantId
                                ? eq(productBatches.variantId, targetVariantId)
                                : isNull(productBatches.variantId)
                        )
                    ).orderBy(asc(productBatches.createdAt));

                    let remainingDiff: number = item.difference || 0;

                    if (remainingDiff < 0) {
                        // LOSS/MISSING
                        for (const batch of batches) {
                            if (remainingDiff === 0) break;

                            const reduction = Math.min(batch.currentStock, Math.abs(remainingDiff));
                            const newStock = batch.currentStock - reduction;

                            await tx.update(productBatches).set({
                                currentStock: newStock,
                                updatedAt: new Date()
                            }).where(eq(productBatches.id, batch.id));

                            await ActivityLogService.log({
                                userId,
                                action: "UPDATE",
                                entityType: "product_batch",
                                entityId: batch.id,
                                description: `Stock adjusted (LOSS) via SO ${id}. Batch reduction: -${reduction}`,
                                details: { oldValue: { stock: batch.currentStock }, newValue: { stock: newStock } }
                            }, tx);

                            remainingDiff += reduction;
                        }
                    } else {
                        // SURPLUS
                        if (batches.length > 0) {
                            const firstBatch = batches[0];
                            const newStock = firstBatch.currentStock + remainingDiff;

                            await tx.update(productBatches).set({
                                currentStock: newStock,
                                updatedAt: new Date()
                            }).where(eq(productBatches.id, firstBatch.id));

                            await ActivityLogService.log({
                                userId,
                                action: "UPDATE",
                                entityType: "product_batch",
                                entityId: firstBatch.id,
                                description: `Stock adjusted (SURPLUS) via SO ${id}. Added: +${remainingDiff}`,
                                details: { oldValue: { stock: firstBatch.currentStock }, newValue: { stock: newStock } }
                            }, tx);
                        }
                    }

                    // Update parent product stock aggregate
                    await tx.update(products).set({
                        stock: sql`${products.stock} + ${item.difference}`
                    }).where(eq(products.id, item.productId));
                }
            }

            await tx.update(stockOpnameSessions).set({
                status: "completed",
                completedAt: new Date()
            }).where(eq(stockOpnameSessions.id, id));
        });

        await ActivityLogService.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Finalized stock opname session ${id}`
        }, effectiveDb);

        return { success: true };
    }

    async cancelSession(id: string, userId: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        await effectiveDb.update(stockOpnameSessions).set({
            status: "cancelled"
        }).where(eq(stockOpnameSessions.id, id));

        await ActivityLogService.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Cancelled stock opname session ${id}`
        }, effectiveDb);
    }

    async getAdjustmentHistory(dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const usersMap = await effectiveDb.query.users.findMany().then((rows: any[]) => {
            const map: Record<string, string> = {};
            rows.forEach(r => map[r.id] = r.name);
            return map;
        });

        return await effectiveDb.select({
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
                    eq(stockOpnameSessions.status, 'completed'),
                    sql`${stockOpnameItems.physicalStock} != ${stockOpnameItems.systemStock}`
                )
            )
            .orderBy(desc(stockOpnameSessions.completedAt))
            .then((rows: any[]) => rows.map((r: any) => ({
                ...r,
                userName: usersMap[r.userId as any] || 'Unknown'
            })));
    }
}

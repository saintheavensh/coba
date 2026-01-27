import { db } from "../../db";
import { stockOpnameSessions, stockOpnameItems, productBatches, products } from "../../db/schema";
import { eq, and, sql, asc, desc, or, isNull } from "drizzle-orm";
import { ActivityLogService } from "../../lib/activity-log.service";

export class StockOpnameService {
    async createSession(userId: string, notes?: string, categoryId?: string) {
        const sessionId = `SO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

        await db.transaction(async (tx) => {
            await tx.insert(stockOpnameSessions).values({
                id: sessionId,
                userId,
                notes,
                status: "draft"
            });

            // Fetch batches based on category filter
            let batchesQuery = tx.select().from(productBatches);

            if (categoryId) {
                const productList = await tx.select({ id: products.id })
                    .from(products)
                    .where(eq(products.categoryId, categoryId));
                const productIds = productList.map(p => p.id);

                if (productIds.length === 0) return; // No products in category

                const batches = await tx.query.productBatches.findMany({
                    where: (b, { inArray }) => inArray(b.productId, productIds)
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
        });

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

    async getSessions() {
        return await db.query.stockOpnameSessions.findMany({
            with: { user: true },
            orderBy: (s, { desc }) => [desc(s.createdAt)]
        });
    }

    async getSessionDetails(id: string) {
        // Use simple select instead of Relational API to avoid potential proxy issues
        const sessionArr = await db.select().from(stockOpnameSessions).where(eq(stockOpnameSessions.id, id));
        if (sessionArr.length === 0) return null;
        const session = sessionArr[0];

        // Fetch items with product details
        const items = await db.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            difference: stockOpnameItems.difference,
            adjustmentReason: stockOpnameItems.adjustmentReason,
            product: products
        })
            .from(stockOpnameItems)
            .leftJoin(products, eq(stockOpnameItems.productId, products.id))
            .where(eq(stockOpnameItems.sessionId, id));

        return { ...session, items: items.map(i => ({ ...i, product: i.product })) };
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string) {
        const item = await db.query.stockOpnameItems.findFirst({
            where: eq(stockOpnameItems.id, itemId)
        });
        if (!item) throw new Error("Item not found");

        const difference = physicalStock - item.systemStock;

        await db.update(stockOpnameItems).set({
            physicalStock,
            difference,
            adjustmentReason: reason
        }).where(eq(stockOpnameItems.id, itemId));

        return { difference };
    }

    async finalizeSession(id: string, userId: string) {
        const session = await this.getSessionDetails(id);
        if (!session) throw new Error("Session not found");
        if (session.status !== "draft") throw new Error("Only draft sessions can be finalized");

        await db.transaction(async (tx) => {
            for (const item of session.items) {
                if (item.physicalStock === null) continue; // Skip items that weren't counted

                if (item.difference !== 0) {
                    // FIFO Adjustment Logic
                    // 1. Get all batches for this product + variant, ordered by creation (oldest first)
                    const batches = await tx.select().from(productBatches).where(
                        and(
                            eq(productBatches.productId, item.productId),
                            (!item.variantName || item.variantName === "Standard")
                                ? or(
                                    isNull(productBatches.variant),
                                    eq(productBatches.variant, ""),
                                    eq(productBatches.variant, "Standard")
                                )
                                : eq(productBatches.variant, item.variantName)
                        )
                    ).orderBy(asc(productBatches.createdAt));

                    let remainingDiff: number = item.difference || 0;

                    if (remainingDiff < 0) {
                        // LOSS/MISSING: Subtract from oldest batches first
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
                            });

                            remainingDiff += reduction;
                        }
                    } else {
                        // SURPLUS: Add to the oldest batch (or just any, but we'll stick to first)
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
                            });
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
        });

        return { success: true };
    }

    async cancelSession(id: string, userId: string) {
        await db.update(stockOpnameSessions).set({
            status: "cancelled"
        }).where(eq(stockOpnameSessions.id, id));

        await ActivityLogService.log({
            userId,
            action: "UPDATE",
            entityType: "stock_opname",
            entityId: id,
            description: `Cancelled stock opname session ${id}`
        });
    }

    async getAdjustmentHistory() {
        const users = await db.query.users.findMany().then(rows => {
            const map: Record<string, string> = {};
            rows.forEach(r => map[r.id] = r.name);
            return map;
        });

        // Use simple select joins for stability
        return await db.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            productName: products.name,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            difference: stockOpnameItems.difference,
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
                    sql`${stockOpnameItems.difference} != 0`
                )
            )
            .orderBy(desc(stockOpnameSessions.completedAt))
            .then(rows => rows.map(r => ({
                ...r,
                userName: users[r.userId as any] || 'Unknown' // Wait, I need userId in select
            })));
    }
}

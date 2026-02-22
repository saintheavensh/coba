import { db } from "../../../../db";
import { purchases, purchaseItems } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { PurchaseOrder, PurchaseItem, PurchaseStatus } from "../../domain/entities/purchase.entity";

export class PurchaseRepositoryAdapter implements IPurchaseRepository {
    async findById(id: string): Promise<PurchaseOrder | null> {
        const result = await db.query.purchases.findFirst({
            where: eq(purchases.id, id),
            with: {
                items: true
            }
        });

        if (!result) return null;

        // Map Drizzle result to Domain Entity
        const items = (result.items || []).map(item => new PurchaseItem({
            id: item.id,
            productId: item.productId,
            variantId: item.variant || undefined, // Map 'variant' (string) to variantId
            qtyOrdered: item.qtyOrdered,
            qtyReceived: item.qtyReceived,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            batchId: item.batchId || undefined
        }));

        return new PurchaseOrder({
            id: result.id,
            supplierId: result.supplierId,
            userId: result.userId || undefined,
            totalAmount: result.totalAmount,
            status: result.status as PurchaseStatus, // Basic cast for now
            items: items,
            date: result.date || undefined,
            referenceNumber: result.referenceNumber || undefined,
            notes: result.notes || undefined,
            receivedAt: result.receivedAt || undefined,
            verifiedAt: result.verifiedAt || undefined
        });
    }

    async save(purchase: PurchaseOrder, dbOrTx?: any): Promise<void> {
        const client = dbOrTx || db;
        const snapshot = purchase.toSnapshot();

        await client.transaction(async (tx: any) => {
            // Upsert Purchase Header
            await tx.insert(purchases).values({
                id: snapshot.id,
                supplierId: snapshot.supplierId,
                userId: snapshot.userId,
                totalAmount: snapshot.totalAmount,
                status: snapshot.status,
                date: snapshot.date,
                referenceNumber: snapshot.referenceNumber,
                notes: snapshot.notes,
                receivedAt: snapshot.receivedAt,
                verifiedAt: snapshot.verifiedAt
            }).onConflictDoUpdate({
                target: purchases.id,
                set: {
                    status: snapshot.status,
                    totalAmount: snapshot.totalAmount,
                    receivedAt: snapshot.receivedAt,
                    verifiedAt: snapshot.verifiedAt,
                    notes: snapshot.notes
                }
            });

            // Upsert Purchase Items
            for (const item of snapshot.items) {
                await tx.insert(purchaseItems).values({
                    id: item.id,
                    purchaseId: snapshot.id,
                    productId: item.productId,
                    variant: item.variantId,
                    qtyOrdered: item.qtyOrdered,
                    qtyReceived: item.qtyReceived,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    batchId: item.batchId
                }).onConflictDoUpdate({
                    target: purchaseItems.id,
                    set: {
                        qtyReceived: item.qtyReceived,
                        batchId: item.batchId
                    }
                });
            }
        });
    }

    async findAll(filters?: any): Promise<PurchaseOrder[]> {
        // Implementation for listing (simplified for now)
        const results = await db.query.purchases.findMany({
            with: {
                items: true
            },
            orderBy: (purchases, { desc }) => [desc(purchases.date)]
        });

        return results.map(result => {
            const items = (result.items || []).map(item => new PurchaseItem({
                id: item.id,
                productId: item.productId,
                variantId: item.variant || undefined,
                qtyOrdered: item.qtyOrdered,
                qtyReceived: item.qtyReceived,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                batchId: item.batchId || undefined
            }));

            return new PurchaseOrder({
                id: result.id,
                supplierId: result.supplierId,
                userId: result.userId || undefined,
                totalAmount: result.totalAmount,
                status: result.status as PurchaseStatus,
                items: items,
                date: result.date || undefined,
                referenceNumber: result.referenceNumber || undefined,
                notes: result.notes || undefined,
                receivedAt: result.receivedAt || undefined,
                verifiedAt: result.verifiedAt || undefined
            });
        });
    }

    async delete(id: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
            await tx.delete(purchases).where(eq(purchases.id, id));
        });
    }
}

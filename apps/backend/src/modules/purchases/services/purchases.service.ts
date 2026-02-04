import { PurchasesModel } from "../models/purchases.model";
import { db } from "../../../db";
import { purchases, purchaseItems, productBatches, products, activityLogs, productVariants } from "../../../db/schema";
import { ActivityLogService } from "../../../lib/activity-log.service";
import { eq, sql, and } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../lib/utils";
import { JournalService } from "../../accounting/services/journal.service";
import { CashRegisterService } from "../../accounting/services/cash-register.service";

// Service handles the Transaction + Logic
export class PurchasesService {
    private model: PurchasesModel;

    constructor() {
        this.model = new PurchasesModel();
    }

    async getAll(filters?: { search?: string; startDate?: Date; endDate?: Date; userId?: string; limit?: number }, dbOrTx?: any) {
        return await this.model.findAll(filters, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }

    async createPurchase(data: {
        supplierId: string;
        userId?: string;
        notes?: string;
        date?: string;
        items: {
            productId: string;
            variant?: string;
            qty: number;
            buyPrice: number;
            sellPrice: number;
        }[];
    }, dbOrTx?: any) {
        const purchaseId = "PO-" + Date.now().toString();
        const totalAmount = data.items.reduce((sum, item) => sum + (item.buyPrice * item.qty), 0);
        const purchaseDate = data.date ? new Date(data.date) : new Date();

        const effectiveDb = dbOrTx || db;

        if (data.notes) {
            const existing = await effectiveDb.query.purchases.findFirst({
                where: eq(purchases.notes, data.notes)
            });
            if (existing) {
                throw new Error(`Invoice number "${data.notes}" already exists.`);
            }
        }

        return await effectiveDb.transaction(async (tx: any) => {
            // 1. Create Header
            await tx.insert(purchases).values({
                id: purchaseId,
                supplierId: data.supplierId,
                userId: data.userId,
                totalAmount: totalAmount,
                notes: data.notes,
                date: purchaseDate,
            });

            // 2. Process Items
            for (const item of data.items) {
                let batchId: string;
                let variantId: string | null = null;

                // Resolve Variant Name to ID (Auto-Create if not exists)
                if (item.variant) {
                    const existingVariant = await tx.query.productVariants.findFirst({
                        where: and(
                            eq(productVariants.productId, item.productId),
                            eq(productVariants.name, item.variant)
                        )
                    });

                    if (existingVariant) {
                        variantId = existingVariant.id;
                    } else {
                        // Create new variant
                        variantId = "VAR-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 1000);
                        await tx.insert(productVariants).values({
                            id: variantId,
                            productId: item.productId,
                            name: item.variant,
                            defaultPrice: item.sellPrice // Init with this purchase's sell price
                        });
                    }
                }

                const existingBatch = await tx.query.productBatches.findFirst({
                    where: and(
                        eq(productBatches.productId, item.productId),
                        eq(productBatches.supplierId, data.supplierId),
                        eq(productBatches.buyPrice, item.buyPrice),
                        variantId ? eq(productBatches.variantId, variantId) : sql`${productBatches.variantId} IS NULL`
                    )
                });

                if (existingBatch) {
                    batchId = existingBatch.id;
                    await tx.update(productBatches)
                        .set({
                            currentStock: sql`${productBatches.currentStock} + ${item.qty}`,
                            updatedAt: new Date()
                        })
                        .where(eq(productBatches.id, existingBatch.id));
                } else {
                    batchId = "B-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 1000);
                    await tx.insert(productBatches).values({
                        id: batchId,
                        productId: item.productId,
                        supplierId: data.supplierId,
                        variantId: variantId,
                        buyPrice: item.buyPrice,
                        sellPrice: item.sellPrice,
                        initialStock: item.qty,
                        currentStock: item.qty,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                // 3. Purchase Item
                await tx.insert(purchaseItems).values({
                    purchaseId: purchaseId,
                    productId: item.productId,
                    variant: item.variant || null,
                    qtyOrdered: item.qty,
                    qtyReceived: item.qty,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    batchId: batchId
                });

                // 4. Update Product Stock
                const product = await tx.query.products.findFirst({
                    where: eq(products.id, item.productId)
                });
                if (product) {
                    await tx.update(products)
                        .set({ stock: (product.stock || 0) + item.qty })
                        .where(eq(products.id, item.productId));
                }
            }

            // 5. Activity Log
            if (data.userId) {
                await ActivityLogService.log({
                    userId: data.userId,
                    action: "CREATE",
                    entityType: "purchase",
                    entityId: purchaseId,
                    description: `Created purchase ${purchaseId} for ${totalAmount}`
                });
            }

            // 6. Create Accounting Journal
            try {
                await JournalService.create({
                    description: `Pembelian ${purchaseId}`,
                    referenceType: "purchase",
                    referenceId: purchaseId,
                    lines: [
                        {
                            accountId: "1-3000",
                            debit: totalAmount,
                            credit: 0,
                            description: `Pembelian barang ${purchaseId}`
                        },
                        {
                            accountId: "2-1000",
                            debit: 0,
                            credit: totalAmount,
                            description: `Hutang ${purchaseId}`
                        }
                    ],
                }, data.userId || "system", tx);
            } catch (e) {
                console.error("Failed to create accounting journal for purchase", e);
                throw e; // Better consistency
            }

            return { message: "Purchase created", id: purchaseId };
        });
    }

    async deletePurchase(id: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            const purchase = await tx.query.purchases.findFirst({
                where: eq(purchases.id, id),
                with: { items: true }
            });

            if (!purchase) throw new Error("Purchase not found");

            for (const item of purchase.items) {
                // Revert Batch Stock
                if (item.batchId) {
                    const batch = await tx.query.productBatches.findFirst({
                        where: eq(productBatches.id, item.batchId)
                    });
                    if (batch) {
                        await tx.update(productBatches)
                            .set({
                                currentStock: sql`${productBatches.currentStock} - ${item.qtyReceived}`,
                                updatedAt: new Date()
                            })
                            .where(eq(productBatches.id, item.batchId));
                    }
                }

                // Revert Product Stock
                await tx.update(products)
                    .set({ stock: sql`${products.stock} - ${item.qtyReceived}` })
                    .where(eq(products.id, item.productId));
            }

            // Delete Items
            await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
            // Delete Purchase
            await tx.delete(purchases).where(eq(purchases.id, id));
        });
    }
}

import { db } from "../../db";
import { purchases, purchaseItems, productBatches, products, activityLogs } from "../../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { PurchasesRepository } from "./purchases.repository";

// Service handles the Transaction + Logic
export class PurchasesService {
    private repo: PurchasesRepository;

    constructor() {
        this.repo = new PurchasesRepository();
    }

    async getAll(filters?: { search?: string; startDate?: Date; endDate?: Date; userId?: string; limit?: number }) {
        const parsedFilters = {
            search: filters?.search,
            startDate: filters?.startDate,
            endDate: filters?.endDate,
            userId: filters?.userId,
            limit: filters?.limit
        };
        return await this.repo.findAll(parsedFilters);
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
    }) {
        const purchaseId = "PO-" + Date.now().toString();
        const totalAmount = data.items.reduce((sum, item) => sum + (item.buyPrice * item.qty), 0);

        // Use provided date or now
        const purchaseDate = data.date ? new Date(data.date) : new Date();

        // Use Transaction
        // We might need direct DB access here or pass tx to repo.
        // For clean separation, we'll try to keep logic here but use db.transaction

        if (data.notes) {
            const existing = await db.query.purchases.findFirst({
                where: eq(purchases.notes, data.notes)
            });
            if (existing) {
                throw new Error(`Invoice number "${data.notes}" already exists.`);
            }
        }

        await db.transaction(async (tx) => {
            // 1. Create Header
            await tx.insert(purchases).values({
                id: purchaseId,
                supplierId: data.supplierId,
                userId: data.userId,
                totalAmount: totalAmount,
                notes: data.notes,
                date: purchaseDate
            });

            // 2. Process Items
            for (const item of data.items) {
                let batchId: string;

                // Check existing batch (Logic from previous routes)
                // We access via query (using tx)
                const existingBatch = await tx.query.productBatches.findFirst({
                    where: and(
                        eq(productBatches.productId, item.productId),
                        eq(productBatches.supplierId, data.supplierId),
                        eq(productBatches.buyPrice, item.buyPrice),
                        item.variant ? eq(productBatches.variant, item.variant) : sql`${productBatches.variant} IS NULL`
                    )
                });

                if (existingBatch) {
                    batchId = existingBatch.id;
                    await tx.update(productBatches)
                        .set({
                            currentStock: existingBatch.currentStock + item.qty,
                            initialStock: existingBatch.initialStock + item.qty,
                            updatedAt: new Date()
                        })
                        .where(eq(productBatches.id, existingBatch.id));
                } else {
                    batchId = "B-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 1000);
                    await tx.insert(productBatches).values({
                        id: batchId,
                        productId: item.productId,
                        supplierId: data.supplierId,
                        variant: item.variant,
                        buyPrice: item.buyPrice,
                        sellPrice: item.sellPrice,
                        initialStock: item.qty,
                        currentStock: item.qty
                    });
                }

                // 3. Purchase Item
                await tx.insert(purchaseItems).values({
                    purchaseId: purchaseId,
                    productId: item.productId,
                    variant: item.variant,
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
                await tx.insert(activityLogs).values({
                    userId: data.userId,
                    action: "CREATE",
                    entityType: "purchase",
                    entityId: purchaseId,
                    description: `Created purchase ${purchaseId}`,
                    createdAt: new Date()
                });
            }
        });

        return { message: "Purchase created", id: purchaseId };
    }
    async getById(id: string) {
        return await db.query.purchases.findFirst({
            where: eq(purchases.id, id),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                }
            }
        });
    }

    async deletePurchase(id: string) {
        await db.transaction(async (tx) => {
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
                                // initialStock: sql`${productBatches.initialStock} - ${item.qtyOrdered}` // Optional: if we view initial as strict history.
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

            // Log?
        });
    }
}

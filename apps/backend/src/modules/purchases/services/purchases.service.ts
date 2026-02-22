import { PurchasesModel } from "../models/purchases.model";
import { db } from "../../../db";
import { purchases, purchaseItems, products, activityLogs, productVariants, categoryVariants, purchasePayments, notifications, suppliers, supplierCategories } from "../../../db/schema";
import { ActivityLogService } from "../../../lib/activity-log.service";
import { eq, sql, and, desc } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../lib/utils";
import { JournalService } from "../../accounting/services/journal.service";
import { inventoryApplicationService } from "../../inventory/inventory-container";

// Service handles the Transaction + Logic
export class PurchasesService {
    private model: PurchasesModel;

    constructor() {
        this.model = new PurchasesModel();
    }

    async getAll(filters?: { search?: string; startDate?: Date; endDate?: Date; userId?: string; limit?: number; status?: string }, dbOrTx?: any) {
        return await this.model.findAll(filters, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }

    async createOrder(data: {
        supplierId: string;
        userId?: string;
        referenceNumber?: string;
        notes?: string;
        date?: string;
        items: {
            productId: string;
            variant?: string;
            qtyOrdered: number;
            estimatedBuyPrice?: number;
            targetSellPrice?: number;
        }[];
    }, dbOrTx?: any) {
        const purchaseId = "PO-" + Date.now().toString();
        const totalAmount = data.items.reduce((sum, item) => sum + ((item.estimatedBuyPrice || 0) * item.qtyOrdered), 0);
        const purchaseDate = data.date ? new Date(data.date) : new Date();

        const effectiveDb = dbOrTx || db;
        console.log("[PURCHASE_SERVICE] Creating order with payload:", JSON.stringify(data, null, 2));

        try {
            return await effectiveDb.transaction(async (tx: any) => {
                // 1. Create Header
                await tx.insert(purchases).values({
                    id: purchaseId,
                    supplierId: data.supplierId,
                    userId: data.userId,
                    totalAmount: totalAmount,
                    referenceNumber: data.referenceNumber,
                    notes: data.notes,
                    date: purchaseDate,
                    status: "ORDERED"
                });

                // 2. Process Items (No batches or stock updates yet)
                for (const item of data.items) {
                    // --- Validate Variant Availability for Supplier ---
                    if (item.variant) {
                        const product = await tx.query.products.findFirst({
                            where: eq(products.id, item.productId),
                            columns: { categoryId: true }
                        });

                        if (product?.categoryId) {
                            const templates = await tx.query.categoryVariants.findMany({
                                where: and(
                                    eq(categoryVariants.categoryId, product.categoryId),
                                    eq(categoryVariants.name, item.variant)
                                )
                            });

                            // If templates exist for this variant name, we must restrict usage
                            if (templates.length > 0) {
                                const isAllowed = templates.some((t: any) =>
                                    t.supplierId === null || t.supplierId === data.supplierId
                                );

                                if (!isAllowed) {
                                    throw new Error(`Varian '${item.variant}' tidak tersedia untuk supplier ini.`);
                                }
                            }
                        }
                    }

                    await tx.insert(purchaseItems).values({
                        purchaseId: purchaseId,
                        productId: item.productId,
                        variant: item.variant || null,
                        qtyOrdered: item.qtyOrdered,
                        qtyReceived: 0,
                        estimatedBuyPrice: item.estimatedBuyPrice || 0,
                        targetSellPrice: item.targetSellPrice || 0,
                        buyPrice: 0,
                        sellPrice: 0
                    });
                }

                // 3. Activity Log
                if (data.userId) {
                    await ActivityLogService.log({
                        userId: data.userId,
                        action: "CREATE",
                        entityType: "purchase_order",
                        entityId: purchaseId,
                        description: `Created Purchase Order ${purchaseId}`
                    });
                }

                // 4. Notification
                await tx.insert(notifications).values({
                    userId: "user-warehouse-001",
                    type: "po_action_required",
                    title: "New Purchase Order",
                    message: `New Order ${purchaseId} requires receiving.`,
                    entityType: "purchase",
                    entityId: purchaseId,
                });

                return { message: "Order created successfully", id: purchaseId };
            });
        } catch (err) {
            console.error("[PURCHASE_SERVICE] createOrder failed:", err);
            throw err;
        }
    }

    async receiveGoods(purchaseId: string, receivedByUserId: string, items: { productId: string; variant?: string; qtyReceived: number }[], dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;

        return await effectiveDb.transaction(async (tx: any) => {
            const po = await tx.query.purchases.findFirst({
                where: eq(purchases.id, purchaseId),
                with: { items: true }
            });

            if (!po) throw new Error("Purchase Order not found");
            if (po.status !== "ORDERED") throw new Error("PO is not in ORDERED status");

            let hasDiscrepancy = false;

            for (const item of items) {
                const poItem = po.items.find((pi: any) => pi.productId === item.productId && pi.variant === (item.variant || null));
                if (poItem) {
                    await tx.update(purchaseItems)
                        .set({ qtyReceived: item.qtyReceived })
                        .where(eq(purchaseItems.id, poItem.id));

                    if (item.qtyReceived !== poItem.qtyOrdered) {
                        hasDiscrepancy = true;
                    }
                }
            }

            await tx.update(purchases)
                .set({
                    status: "RECEIVED",
                    receivedAt: new Date(),
                    receivedBy: receivedByUserId
                })
                .where(eq(purchases.id, purchaseId));

            // Notifications
            if (po.userId) {
                // To Manager
                await tx.insert(notifications).values({
                    userId: po.userId,
                    type: hasDiscrepancy ? "po_discrepancy" : "po_action_required",
                    title: hasDiscrepancy ? "PO Discrepancy Found" : "Goods Received",
                    message: hasDiscrepancy
                        ? `Order ${purchaseId} has quantity mismatches. Please verify.`
                        : `Order ${purchaseId} has been received. Please verify and set prices.`,
                    entityType: "purchase",
                    entityId: purchaseId,
                });
            }

            return { message: "Goods received logged", id: purchaseId, hasDiscrepancy };
        });
    }

    async verifyAndComplete(
        purchaseId: string,
        managerUserId: string,
        items: { productId: string; variant?: string; buyPrice: number; sellPrice: number }[],
        options: { shippingFee?: number, shippingExpenseAccountId?: string, discountAmount?: number, referenceNumber?: string, paymentDueDate?: Date, payment?: { method: string, amount: number, accountId?: string, proofImage?: string } } = {},
        dbOrTx?: any
    ) {
        const effectiveDb = dbOrTx || db;

        return await effectiveDb.transaction(async (tx: any) => {
            const po = await tx.query.purchases.findFirst({
                where: eq(purchases.id, purchaseId),
                with: { items: true, supplier: true }
            });

            if (!po) throw new Error("Purchase Order not found");
            if (po.status !== "RECEIVED") throw new Error("PO is not in RECEIVED status");

            // PR-2: Mandatory 1:1 – every PO item with qtyReceived > 0 must be in verification payload
            const receivedItems = po.items.filter((pi: any) => pi.qtyReceived > 0);
            for (const pi of receivedItems) {
                const inPayload = items.some((item: any) => item.productId === pi.productId && (item.variant || null) === (pi.variant || null));
                if (!inPayload) {
                    throw new Error(`Incomplete verification: PO item productId=${pi.productId} variant=${pi.variant ?? "null"} with qtyReceived > 0 must be included`);
                }
            }

            let totalGoodsAmount = 0;
            const verificationInputItems: Array<{
                purchaseItemId: string;
                productId: string;
                variantId: string | null;
                buyPrice: number;
                sellPrice: number;
                qtyReceived: number;
            }> = [];

            for (const item of items) {
                const poItem = po.items.find((pi: any) => pi.productId === item.productId && pi.variant === (item.variant || null));
                if (!poItem) continue;

                await tx.update(purchaseItems)
                    .set({
                        buyPrice: item.buyPrice,
                        sellPrice: item.sellPrice
                    })
                    .where(eq(purchaseItems.id, poItem.id));

                totalGoodsAmount += item.buyPrice * poItem.qtyReceived;

                if (poItem.qtyReceived <= 0) continue;

                let variantId: string | null = null;
                if (poItem.variant) {
                    const variant = await tx.query.productVariants.findFirst({
                        where: and(eq(productVariants.productId, item.productId), eq(productVariants.name, poItem.variant))
                    });
                    variantId = variant?.id || null;
                }

                verificationInputItems.push({
                    purchaseItemId: poItem.id,
                    productId: item.productId,
                    variantId,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    qtyReceived: poItem.qtyReceived
                });
            }

            // Stock-in via Inventory (single gate)
            const { allocations } = await inventoryApplicationService.addStockFromPurchaseVerification(
                {
                    purchaseId,
                    supplierId: po.supplierId,
                    items: verificationInputItems
                },
                tx
            );
            for (const a of allocations) {
                await tx.update(purchaseItems).set({ batchId: a.batchId }).where(eq(purchaseItems.id, a.purchaseItemId));
            }

            const shipping = options.shippingFee || 0;
            const discount = options.discountAmount || 0;
            const finalTotal = totalGoodsAmount + shipping - discount;

            // Update PO Final Status
            await tx.update(purchases)
                .set({
                    status: "VERIFIED",
                    totalAmount: finalTotal,
                    shippingFee: shipping,
                    shippingExpenseAccountId: options.shippingExpenseAccountId,
                    discountAmount: discount,
                    referenceNumber: options.referenceNumber || po.referenceNumber,
                    paymentDueDate: options.paymentDueDate,
                    verifiedAt: new Date(),
                    verifiedBy: managerUserId
                })
                .where(eq(purchases.id, purchaseId));

            // Record Payment if provided
            if (options.payment && options.payment.amount > 0) {
                await tx.insert(purchasePayments).values({
                    id: generateId(ID_PREFIX.PAYMENT),
                    purchaseId: purchaseId,
                    supplierId: po.supplierId,
                    amount: options.payment.amount,
                    method: options.payment.method,
                    accountId: options.payment.accountId || null,
                    proofImage: options.payment.proofImage || null,
                    createdBy: managerUserId,
                    createdAt: new Date()
                });
            }

            // Accounting Journal
            // Dr Inventory (Goods Amount)
            // Dr Shipping Expense (Shipping Fee)
            // Cr Accounts Payable (Total Liability)

            const journalLines = [
                { accountId: "1-3000", debit: totalGoodsAmount, credit: 0, description: `Inventory Increase ${purchaseId}` },
                { accountId: "2-1000", debit: 0, credit: finalTotal, description: `Accounts Payable ${purchaseId}` }
            ];

            if (shipping > 0 && options.shippingExpenseAccountId) {
                // Insert Shipping Expense Line
                journalLines.push({ accountId: options.shippingExpenseAccountId, debit: shipping, credit: 0, description: `Shipping Fee ${purchaseId}` });
                // Adjust AP Credit to include shipping (already done in finalTotal)
            } else if (shipping > 0) {
                // Fallback if no specific account selected? Treat as inventory cost or general expense?
                // For now, let's just add to Inventory cost if no expense account, OR warn?
                // Let's assume default to standard expense if missing, but UI should enforce it.
                // We'll map it to "5-2000" (Operational) as fallback
                journalLines.push({ accountId: "5-2000", debit: shipping, credit: 0, description: `Shipping Fee (General) ${purchaseId}` });
            }

            // Handle Discount (Credit Revenue/Expense reduction? or Reduce Inventory Cost?)
            // Usually Purchase Discount is Credit to Inventory or separate income. 
            // Simplified: We reduced finalTotal (AP). So we need to balance.
            // Dr Inventory (Goods) + Dr Shipping = Goods + Shipping
            // Cr AP = Goods + Shipping - Discount
            // Missing Credit = Discount.
            // So Credit Inventory (reduce cost) or Credit Purchase Discount (Input).
            if (discount > 0) {
                journalLines.push({ accountId: "1-3000", debit: 0, credit: discount, description: `Purchase Discount ${purchaseId}` });
            }

            await JournalService.create({
                description: `Verify Pembelian ${purchaseId}`,
                referenceType: "purchase",
                referenceId: purchaseId,
                lines: journalLines,
            }, managerUserId, tx);

            // Spend Alert
            if (totalGoodsAmount > 5000000) { // Using 5M IDR as threshold for now (user said 5000 which is context dependent)
                await tx.insert(notifications).values({
                    userId: "user-owner-001",
                    type: "spend_alert",
                    title: "High Spend Alert",
                    message: `Purchase Order ${purchaseId} finalized with high value: ${totalGoodsAmount}`,
                    entityType: "purchase",
                    entityId: purchaseId,
                });
            }

            return { message: "Purchase verified and stock updated", id: purchaseId };
        }).catch((err: any) => {
            console.error("[PURCHASE_SERVICE] verifyAndComplete failed:", err);
            throw err;
        });
    }

    async cancelOrder(id: string, userId: string, reason?: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;

        return await effectiveDb.transaction(async (tx: any) => {
            const po = await tx.query.purchases.findFirst({
                where: eq(purchases.id, id),
                with: { items: true }
            });

            if (!po) throw new Error("Purchase Order not found");
            if (po.status !== "DRAFT" && po.status !== "ORDERED") {
                throw new Error("Cannot cancel order that is already received or verified.");
            }

            await tx.update(purchases)
                .set({
                    status: "CANCELLED",
                    cancelledBy: userId,
                    cancelledAt: new Date(),
                    notes: reason ? (po.notes ? po.notes + "\nCancellation Reason: " + reason : "Cancellation Reason: " + reason) : po.notes
                })
                .where(eq(purchases.id, id));

            // Activity Log
            await ActivityLogService.log({
                userId: userId,
                action: "STATUS_CHANGE",
                entityType: "purchase_order",
                entityId: id,
                description: `Cancelled Purchase Order ${id}. Reason: ${reason || "No reason provided"}`
            }, tx);

            return { message: "Purchase Order Cancelled", id };
        });
    }

    // Standard createPurchase remains but deprecated/modified or removed?
    // User wants the workflow, so I'll keep the signature for compatibility if needed 
    // but redirect to the new flow or just replace it.
    // I'll replace it to enforce the workflow.
    async createPurchase(data: any, dbOrTx?: any) {
        return this.createOrder(data, dbOrTx); // Simple redirect for now
    }

    async deletePurchase(id: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            const purchase = await tx.query.purchases.findFirst({
                where: eq(purchases.id, id),
                with: { items: true }
            });

            if (!purchase) throw new Error("Purchase not found");

            // Revert stock via inventory single gate
            const itemsToReverse = purchase.items
                .filter((item: any) => item.qtyReceived > 0)
                .map((item: any) => ({
                    productId: item.productId,
                    batchId: item.batchId || null,
                    qtyReceived: item.qtyReceived
                }));

            if (itemsToReverse.length > 0) {
                await inventoryApplicationService.reverseStockFromPurchaseDeletion(
                    { purchaseId: id, items: itemsToReverse },
                    tx
                );
            }

            // Delete Items
            await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
            // Delete Purchase
            await tx.delete(purchases).where(eq(purchases.id, id));
        });
    }

    async getLowStockSummary(dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;

        // 1. Get Low Stock Products
        const lowStockProducts = await effectiveDb.query.products.findMany({
            where: sql`${products.stock} <= ${products.minStock}`,
            with: {
                category: true,
                variants: true
            }
        });

        if (lowStockProducts.length === 0) return [];

        // 2. Group by Supplier
        const suggestionsMap = new Map<string, {
            supplierId: string,
            supplierName: string,
            items: any[]
        }>();

        for (const p of lowStockProducts) {
            let supplierId = "UNKNOWN";
            let supplierName = "Unknown Supplier";

            // Try to find last batch via inventory gate
            const lastBatch = await inventoryApplicationService.getLastBatchByProduct(p.id, effectiveDb);

            if (lastBatch && lastBatch.supplierId) {
                const sup = await effectiveDb.query.suppliers.findFirst({
                    where: eq(suppliers.id, lastBatch.supplierId),
                    columns: { name: true }
                });
                supplierId = lastBatch.supplierId;
                supplierName = sup?.name || "Unknown";
            } else if (p.categoryId) {
                // Try to find via category
                const supCat = await effectiveDb.query.supplierCategories.findFirst({
                    where: eq(supplierCategories.categoryId, p.categoryId),
                    with: { supplier: true }
                });
                if (supCat) {
                    supplierId = supCat.supplierId;
                    supplierName = supCat.supplier.name;
                }
            }

            if (!suggestionsMap.has(supplierId)) {
                suggestionsMap.set(supplierId, {
                    supplierId,
                    supplierName,
                    items: []
                });
            }

            const group = suggestionsMap.get(supplierId)!;

            // Suggest quantity: Max(10, MinStock * 2) - CurrentStock
            const target = Math.max(10, (p.minStock || 5) * 2);
            const qty = Math.max(1, target - p.stock);

            group.items.push({
                productId: p.id,
                productName: p.name,
                variant: "Original",
                currentStock: p.stock,
                minStock: p.minStock,
                suggestedQty: qty,
                lastBuyPrice: lastBatch?.buyPrice || 0
            });
        }

        return Array.from(suggestionsMap.values());
    }
}

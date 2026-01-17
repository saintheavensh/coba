import { db } from "../../db";
import { sales, saleItems, productBatches, products, activityLogs, members, salePayments } from "../../db/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { SalesRepository } from "./sales.repository";

export class SalesService {
    private repo: SalesRepository;

    constructor() {
        this.repo = new SalesRepository();
    }

    async getAll(query: { startDate?: string; endDate?: string; search?: string; limit?: string }) {
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        // End date should be end of day if only date string provided
        const endDate = query.endDate ? new Date(query.endDate + "T23:59:59") : undefined;
        const limit = query.limit ? parseInt(query.limit) : 50;

        return await this.repo.findAll({
            startDate,
            endDate,
            search: query.search,
            limit
        });
    }

    async getOne(id: string) {
        return await this.repo.findById(id);
    }

    async createSale(data: {
        memberId?: string;
        customerName?: string;
        payments: {
            method: string;
            methodId?: string;
            variantId?: string;
            variantName?: string;
            amount: number;
            reference?: string;
        }[];
        userId: string;
        notes?: string;
        items: {
            productId: string;
            // batchId removed
            variant: string;
            qty: number;
            price: number;
        }[];
        discountAmount?: number;
    }) {
        const saleId = "SAL-" + Date.now().toString();
        const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const finalAmount = subtotal - (data.discountAmount || 0);

        // 1. Validate Payments
        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
        // Allow slight tolerance or require exact/over? 
        // Usually Over is fine (Cash change), Under is not unless strictly Partial.
        // For now, require totalPaid >= finalAmount.
        if (totalPaid < finalAmount) {
            throw new Error(`Insufficient payment. Total: ${finalAmount}, Paid: ${totalPaid}`);
        }

        // Determine Payment Status & Method String
        const methodTypes = new Set(data.payments.map(p => p.method));
        // Simplistic determination. If multiple, mixed. If one, usage that one.
        // We cast to specific union for TS satisfaction but store whatever string in DB technically (schema has enum but Drizzle might enforce it on insert if using typed schema object, but 'sales' table 'paymentMethod' column IS enum.
        // We should map new methods to 'cash' | 'transfer' | 'qris' | 'mixed' as best effort?
        // Or update schema enum. Schema enum for `sales.paymentMethod` is ["cash", "transfer", "qris", "mixed"].
        // If "Tempo", we can map to "mixed" or add "tempo"?
        // Let's rely on "mixed" if complex, or map based on type.

        // Better: Map known IDs/Names to the legacy enum
        let paymentMethodStr: "cash" | "transfer" | "qris" | "mixed" = "mixed";
        if (data.payments.length === 1) {
            const m = data.payments[0].method.toLowerCase();
            if (m.includes("cash") || m.includes("tunai")) paymentMethodStr = "cash";
            else if (m.includes("transfer")) paymentMethodStr = "transfer";
            else if (m.includes("qris")) paymentMethodStr = "qris";
            else paymentMethodStr = "mixed"; // Fallback for Tempo/Other
        } else {
            paymentMethodStr = "mixed";
        }

        const nonTempoAmount = data.payments
            .filter(p => !p.method.toLowerCase().includes("tempo") && p.methodId !== "PM-TEMPO")
            .reduce((sum, p) => sum + p.amount, 0);

        let paymentStatus: "paid" | "partial" | "unpaid" = "paid";
        if (nonTempoAmount >= finalAmount) {
            paymentStatus = "paid";
        } else if (nonTempoAmount > 0) {
            paymentStatus = "partial";
        } else {
            paymentStatus = "unpaid";
        }

        await db.transaction(async (tx) => {
            // Handle Tempo (Debt)
            const tempoPayment = data.payments.find(p => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"));
            if (tempoPayment) {
                if (!data.memberId) {
                    throw new Error("Customer memberId is required for Tempo payments.");
                }
                const member = await tx.query.members.findFirst({
                    where: eq(members.id, data.memberId)
                });
                if (!member) {
                    throw new Error("Customer not found.");
                }

                // Credit Limit Check
                const currentDebt = member.debt || 0;
                const creditLimit = member.creditLimit || 0;
                if (creditLimit > 0 && (currentDebt + tempoPayment.amount > creditLimit)) {
                    throw new Error(`Credit limit exceeded. Limit: ${creditLimit}, Current Debt: ${currentDebt}, New: ${tempoPayment.amount}`);
                }

                // Increase Debt
                await tx.update(members)
                    .set({ debt: currentDebt + tempoPayment.amount })
                    .where(eq(members.id, data.memberId));
            }

            // 1. Create Sale Header
            await tx.insert(sales).values({
                id: saleId,
                memberId: data.memberId,
                customerName: data.customerName,
                paymentMethod: paymentMethodStr,
                paymentStatus: paymentStatus,
                userId: data.userId,
                totalAmount: subtotal,
                discountAmount: data.discountAmount || 0,
                finalAmount: finalAmount < 0 ? 0 : finalAmount,
                notes: data.notes
            });

            // 1.5 Insert Payments
            for (const p of data.payments) {
                await tx.insert(salePayments).values({
                    saleId: saleId,
                    method: p.method,
                    methodId: p.methodId,
                    variantName: p.variantName,
                    variantId: p.variantId,
                    amount: p.amount,
                    reference: p.reference
                });
            }

            // 2. Process Items (FIFO)
            for (const item of data.items) {
                let remainingQty = item.qty;

                // Find batches with stock for this product & variant, sort by Oldest First
                const batches = await tx.query.productBatches.findMany({
                    where: and(
                        eq(productBatches.productId, item.productId),
                        eq(productBatches.variant, item.variant),
                        gt(productBatches.currentStock, 0)
                    ),
                    orderBy: [asc(productBatches.createdAt)]
                });

                // Calculate Total Available for specific variant
                const totalVariantStock = batches.reduce((sum, b) => sum + b.currentStock, 0);
                if (totalVariantStock < remainingQty) {
                    throw new Error(`Insufficient stock for Product ${item.productId} (${item.variant}). Available: ${totalVariantStock}, Requested: ${remainingQty}`);
                }

                // Deduct from batches
                for (const batch of batches) {
                    if (remainingQty <= 0) break;

                    const deduct = Math.min(batch.currentStock, remainingQty);

                    // Update Batch Stock
                    await tx.update(productBatches)
                        .set({
                            currentStock: batch.currentStock - deduct,
                            updatedAt: new Date()
                        })
                        .where(eq(productBatches.id, batch.id));

                    // Create Sale Item (One per batch split to maintain Cost Basis accuracy)
                    await tx.insert(saleItems).values({
                        saleId: saleId,
                        productId: item.productId,
                        batchId: batch.id,
                        variant: item.variant,
                        qty: deduct,
                        price: item.price, // Selling Price (from input)
                        subtotal: deduct * item.price
                    });

                    remainingQty -= deduct;
                }

                if (remainingQty > 0) {
                    // Should not start transaction if not enough, but concurrency might cause this
                    throw new Error(`Concurrency Error: Stock changed during processing for ${item.productId}`);
                }

                // Update Overall Product Stock
                const product = await tx.query.products.findFirst({
                    where: eq(products.id, item.productId)
                });
                if (product) {
                    await tx.update(products)
                        .set({ stock: (product.stock || 0) - item.qty })
                        .where(eq(products.id, item.productId));
                }
            }

            // 3. Log
            await tx.insert(activityLogs).values({
                userId: data.userId,
                action: "CREATE",
                entityType: "sale",
                entityId: saleId,
                description: `Created sale ${saleId} amount ${finalAmount}`,
                newValue: JSON.stringify(data),
                createdAt: new Date()
            });
        });

        // Calculate Change (Kembalian) if Cash > Total
        // Only if not using Tempo (Strict logic: Tempo implies exact amount for correct debt tracking)
        // If Mixed (Cash 100k for 50k bill) -> Return 50k.
        let change = 0;
        if (!data.payments.some(p => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"))) {
            change = totalPaid - finalAmount;
        }

        return { message: "Sale created", id: saleId, change: change > 0 ? change : 0 };
    }
}

import { db } from "../../../db";
import { sales, saleItems, productBatches, products, activityLogs, members, salePayments, productVariants } from "../../../db/schema";
import { ActivityLogService } from "../../../lib/activity-log.service";
import { eq, and, gt, asc, inArray } from "drizzle-orm";
import { SalesModel } from "../models/sales.model";
import { JournalService } from "../../accounting/services/journal.service";
import { CashRegisterService } from "../../accounting/services/cash-register.service";

export class SalesService {
    private model: SalesModel;

    constructor() {
        this.model = new SalesModel();
    }

    async getAll(query: { startDate?: string; endDate?: string; search?: string; limit?: string }, dbOrTx?: any) {
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        // End date should be end of day if only date string provided
        const endDate = query.endDate ? new Date(query.endDate + "T23:59:59") : undefined;
        const limit = query.limit ? parseInt(query.limit) : 50;

        return await this.model.findAll({
            startDate,
            endDate,
            search: query.search,
            limit
        }, dbOrTx);
    }

    async getOne(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
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
    }, dbOrTx?: any) {
        const saleId = "SAL-" + Date.now().toString();
        const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const finalAmount = subtotal - (data.discountAmount || 0);

        // 1. Validate Payments
        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid < finalAmount) {
            throw new Error(`Insufficient payment. Total: ${finalAmount}, Paid: ${totalPaid}`);
        }

        // Determine Payment Status & Method String
        let paymentMethodStr: "cash" | "transfer" | "qris" | "mixed" = "mixed";
        if (data.payments.length === 1) {
            const m = data.payments[0].method.toLowerCase();
            if (m.includes("cash") || m.includes("tunai")) paymentMethodStr = "cash";
            else if (m.includes("transfer")) paymentMethodStr = "transfer";
            else if (m.includes("qris")) paymentMethodStr = "qris";
            else paymentMethodStr = "mixed";
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

        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            // Handle Tempo (Debt)
            const tempoPayment = data.payments.find((p: any) => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"));
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

                const targetVariants = await tx.query.productVariants.findMany({
                    where: and(
                        eq(productVariants.productId, item.productId),
                        eq(productVariants.name, item.variant)
                    ),
                    columns: { id: true }
                });

                const targetVariantIds = targetVariants.map((v: any) => v.id);

                const batches = await tx.query.productBatches.findMany({
                    where: and(
                        eq(productBatches.productId, item.productId),
                        targetVariantIds.length > 0 ? inArray(productBatches.variantId, targetVariantIds) : undefined,
                        gt(productBatches.currentStock, 0)
                    ),
                    orderBy: [asc(productBatches.createdAt)]
                });

                const totalVariantStock = batches.reduce((sum: number, b: any) => sum + b.currentStock, 0);
                if (totalVariantStock < remainingQty) {
                    throw new Error(`Insufficient stock for Product ${item.productId} (${item.variant}). Available: ${totalVariantStock}, Requested: ${remainingQty}`);
                }

                for (const batch of batches) {
                    if (remainingQty <= 0) break;

                    const deduct = Math.min(batch.currentStock, remainingQty);

                    await tx.update(productBatches)
                        .set({
                            currentStock: batch.currentStock - deduct,
                            updatedAt: new Date()
                        })
                        .where(eq(productBatches.id, batch.id));

                    await tx.insert(saleItems).values({
                        saleId: saleId,
                        productId: item.productId,
                        batchId: batch.id,
                        variant: item.variant,
                        qty: deduct,
                        price: item.price,
                    });

                    remainingQty -= deduct;
                }

                if (remainingQty > 0) {
                    throw new Error(`Concurrency Error: Stock changed during processing for ${item.productId}`);
                }

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
            await ActivityLogService.log({
                userId: data.userId,
                action: "CREATE",
                entityType: "sale",
                entityId: saleId,
                description: `Created sale ${saleId} for total ${finalAmount}`,
                details: { newValue: data }
            }, tx);

            // 4. Create Accounting Journal
            try {
                // Calculate COGS
                // We need to fetch items again or use the one we just inserted.
                // Re-fetching inside TX to be safe and get joined batch buyPrice.
                const saleWithItems = await this.model.findById(saleId, tx);
                let cogsAmount = 0;
                if (saleWithItems?.items) {
                    for (const item of saleWithItems.items) {
                        const buyPrice = (item as any).batch?.buyPrice || 0;
                        cogsAmount += buyPrice * item.qty;
                    }
                }

                let debitAccountId = "1-1000";

                if (paymentStatus === "paid") {
                    const { SettingsService } = await import("../../settings/services/settings.service");
                    const settingsService = new SettingsService();
                    const methodConfig = await settingsService.getPaymentMethods(tx);

                    const payment = data.payments[0];
                    const methodDef = methodConfig?.methods.find((m: any) => m.id === payment.methodId || m.name === payment.method);

                    if (methodDef) {
                        const variantDef = methodDef.variants?.find((v: any) => v.id === payment.variantId || v.name === payment.variantName);

                        if (variantDef?.accountId) {
                            debitAccountId = variantDef.accountId;
                        } else if (methodDef.accountId) {
                            debitAccountId = methodDef.accountId;
                        } else {
                            if (methodDef.type === "cash") {
                                debitAccountId = "1-1001";
                            } else if (methodDef.type === "transfer" || methodDef.type === "qris" || methodDef.type === "ewallet") {
                                debitAccountId = "1-1000";
                            }
                        }
                    }
                } else {
                    debitAccountId = "1-2000";
                }

                const journalLines: Array<{ accountId: string; debit: number; credit: number; description: string }> = [];

                journalLines.push({
                    accountId: debitAccountId,
                    debit: finalAmount,
                    credit: 0,
                    description: paymentStatus === 'paid' ? `Penerimaan ${paymentMethodStr}` : `Piutang Penjualan`
                });

                journalLines.push({
                    accountId: "4-1000",
                    debit: 0,
                    credit: finalAmount,
                    description: `Pendapatan ${saleId}`
                });

                if (cogsAmount > 0) {
                    journalLines.push({
                        accountId: "5-1001",
                        debit: cogsAmount,
                        credit: 0,
                        description: `HPP ${saleId}`
                    });
                    journalLines.push({
                        accountId: "1-3000",
                        debit: 0,
                        credit: cogsAmount,
                        description: `Pengurangan persediaan ${saleId}`
                    });
                }

                await JournalService.create({
                    description: `Penjualan ${saleId}`,
                    referenceType: "sale",
                    referenceId: saleId,
                    lines: journalLines,
                }, data.userId, tx);

                // 5. Record in Cash Register
                if (paymentMethodStr === "cash") {
                    await CashRegisterService.recordTransaction({
                        transactionType: "sale",
                        transactionId: saleId,
                        paymentMethod: "cash",
                        amount: finalAmount,
                        description: `Penjualan ${saleId}`
                    }, tx);
                }
            } catch (e) {
                console.error("Failed to create accounting journal for sale", e);
                // In a perfect transactional world, we might want to throw e here
                // to rollback the whole sale if accounting fails.
                // Throwing is safer for data integrity. 
                // Let's THROW if we are already in a transaction.
                throw e;
            }
        });

        let change = 0;
        if (!data.payments.some(p => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"))) {
            change = totalPaid - finalAmount;
        }

        return { message: "Sale created", id: saleId, change: change > 0 ? change : 0 };
    }
}

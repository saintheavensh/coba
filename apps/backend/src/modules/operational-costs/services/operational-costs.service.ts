import { OperationalCostsModel } from "../models/operational-costs.model";
import { db } from "../../../db";
import { operationalCosts } from "../../../db/schema";
import { JournalService } from "../../accounting/services/journal.service";
import { eq } from "drizzle-orm"; // Added missing import

export class OperationalCostsService {
    private model: OperationalCostsModel;

    constructor() {
        this.model = new OperationalCostsModel();
    }

    async getAll(dbOrTx?: any) {
        return await this.model.findAll(100, dbOrTx);
    }

    async create(data: any, userId?: string, dbOrTx?: any) {
        const newData = {
            category: data.category,
            amount: Number(data.amount) || 0,
            date: data.date ? new Date(data.date) : new Date(),
            description: data.description,
            status: data.status || "paid",
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            paidAt: data.status === "paid" ? (data.date ? new Date(data.date) : new Date()) : null,
            userId: userId || null
        };

        const effectiveDb = dbOrTx || db;

        // Use a transaction
        const transactionResult = await effectiveDb.transaction(async (tx: any) => {
            // 1. Insert Operational Cost Record
            // Calling generic DB insert here to support transaction
            const [result] = await tx.insert(operationalCosts).values(newData).returning({ id: operationalCosts.id });
            const costId = result?.id || 0;

            // 2. Journal Entry
            // Only create journal if status is "paid"
            if (newData.status === "paid" && data.sourceAccountId && data.expenseAccountId && newData.amount > 0) {
                try {
                    await JournalService.create({
                        description: `Biaya Operasional: ${newData.category}`,
                        referenceType: "expense",
                        referenceId: costId.toString(),
                        date: newData.date,
                        lines: [
                            {
                                accountId: data.expenseAccountId,
                                debit: newData.amount,
                                credit: 0,
                                description: `${newData.category} - ${newData.description || ''}`
                            },
                            {
                                accountId: data.sourceAccountId,
                                debit: 0,
                                credit: newData.amount,
                                description: `Pembayaran ${newData.category}`
                            }
                        ]
                    }, userId, tx);
                } catch (error) {
                    console.error("Failed to create journal:", error);
                    throw error;
                }
            }

            return { message: "Created", id: costId };
        });

        // The transaction now returns what we need, or we need to capture it. 
        // Actually, db.transaction returns the result of the callback.
        return transactionResult;
    }

    async markAsPaid(id: string, paymentData: { sourceAccountId: string; expenseAccountId: string; date?: Date; notes?: string }, userId?: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;

        await effectiveDb.transaction(async (tx: any) => {
            const cost = await tx.query.operationalCosts.findFirst({
                where: eq(operationalCosts.id, id)
            });

            if (!cost) throw new Error("Expense not found");
            if (cost.status === "paid") throw new Error("Expense already paid");

            const paidAt = paymentData.date || new Date();

            await tx.update(operationalCosts).set({
                status: "paid",
                paidAt: paidAt,
                description: paymentData.notes ? `${cost.description} | ${paymentData.notes}` : cost.description
            }).where(eq(operationalCosts.id, id));

            // Requirement update: We need to pass expenseAccountId when paying.
            if (!paymentData.sourceAccountId || !paymentData.expenseAccountId) {
                throw new Error("Source Account and Expense Account are required for payment");
            }

            try {
                await JournalService.create({
                    description: `Pembayaran Biaya: ${cost.category}`,
                    referenceType: "expense",
                    referenceId: id,
                    date: paidAt,
                    lines: [
                        {
                            accountId: paymentData.expenseAccountId,
                            debit: cost.amount,
                            credit: 0,
                            description: `${cost.category} - ${cost.description || ''}`
                        },
                        {
                            accountId: paymentData.sourceAccountId,
                            debit: 0,
                            credit: cost.amount,
                            description: `Pembayaran ${cost.category}`
                        }
                    ]
                }, userId, tx);
            } catch (error) {
                console.error("Failed to create journal:", error);
                throw error;
            }
        });
    }

    async delete(id: string) {
        return await this.model.delete(id);
    }
}

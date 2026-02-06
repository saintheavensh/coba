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
            userId: userId || null
        };

        const effectiveDb = dbOrTx || db;

        // Use a transaction
        await effectiveDb.transaction(async (tx: any) => {
            // 1. Insert Operational Cost Record
            // Calling generic DB insert here to support transaction
            const [result] = await tx.insert(operationalCosts).values(newData).returning({ id: operationalCosts.id });
            const costId = result?.id || 0;

            // 2. Journal Entry
            if (data.sourceAccountId && data.expenseAccountId && newData.amount > 0) {
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
        });

        return { message: "Created" };
    }

    async delete(id: string) {
        return await this.model.delete(id);
    }
}

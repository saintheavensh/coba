import { DBContext } from "../../../../../shared/types/db-context";
import { ICashRegisterRepository } from "../../domain";
import { CreateJournalUseCase } from "./create-journal.use-case";
import { AuditService } from "../../services/audit.service";

export interface CloseRegisterInput {
    actualClosing: number;
    notes?: string;
    reservation?: { amount: number, targetAccountId: string, sourceAccountId?: string };
}

export class CloseRegisterUseCase {
    constructor(
        private readonly registerRepository: ICashRegisterRepository,
        private readonly createJournalUC: CreateJournalUseCase
    ) { }

    async execute(input: CloseRegisterInput, userId: string, dbOrTx?: DBContext): Promise<{ difference: number }> {
        const current = await this.registerRepository.getCurrent(dbOrTx);
        if (!current) {
            throw new Error("No open cash register found");
        }

        // Calculate expected closing
        const transactions = await this.registerRepository.getTransactions(current.id, dbOrTx);
        const netTransactions = transactions.reduce((sum, t) => {
            if (t.type === 'sale' || t.type === 'deposit') return sum + t.amount;
            return sum - t.amount;
        }, 0);

        const expectedClosing = current.openingBalance + netTransactions;
        const difference = input.actualClosing - expectedClosing;

        await this.registerRepository.update(current.id, {
            closedAt: new Date(),
            closedBy: userId,
            expectedClosing,
            actualClosing: input.actualClosing,
            difference,
            status: "closed",
            notes: input.notes,
        }, dbOrTx);

        // If there is a difference, we might need a journal entry for adjustment.
        // In simpler version, we just log it. In complex, we post to "Short/Over" account.
        if (Math.abs(difference) > 0) {
            // Logic to handle discrepancy journal entry could go here
        }

        await AuditService.log({
            userId,
            action: "CLOSE",
            entityType: "cash_register",
            entityId: current.id,
            tableName: "cash_registers",
            newValues: { expectedClosing, actualClosing: input.actualClosing, difference, notes: input.notes, status: "closed" },
        });

        return { difference };
    }
}

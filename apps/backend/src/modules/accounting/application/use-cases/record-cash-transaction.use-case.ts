import { DBContext } from "../../../../shared/types/db-context";
import { ICashRegisterRepository } from "../../domain";

export interface RecordCashTransactionInput {
    transactionType: "sale" | "service" | "refund" | "adjustment";
    transactionId: string;
    amount: number;
    description?: string;
}

export class RecordCashTransactionUseCase {
    constructor(private readonly registerRepository: ICashRegisterRepository) { }

    async execute(input: RecordCashTransactionInput, dbOrTx?: DBContext): Promise<void> {
        const current = await this.registerRepository.getCurrent(dbOrTx);
        if (!current) {
            throw new Error("No open cash register found. Please open one first.");
        }

        // Record in cash register transactions
        await this.registerRepository.createTransaction({
            id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            registerId: current.id,
            type: input.transactionType,
            referenceType: input.transactionType,
            referenceId: input.transactionId,
            amount: input.amount,
            description: input.description || "",
            createdAt: new Date(),
        }, dbOrTx);

        // Update register expected closing is usually handled by the repository or a domain service
        // If the repository adapter doesn't do it, we should do it here. 
        // Based on legacy logic, it was done in the same transaction.
    }
}

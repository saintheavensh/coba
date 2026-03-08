import { accountingService } from "../accounting-container";

export type TransactionType = "sale" | "service" | "expense" | "refund" | "adjustment";

export interface RecordTransactionInput {
    transactionType: TransactionType;
    transactionId?: string;
    paymentMethod: string;
    amount: number;
    description?: string;
}

export class CashRegisterService {
    /**
     * Check if register is open
     */
    static async isRegisterOpen(dbOrTx?: any): Promise<boolean> {
        return await accountingService.isRegisterOpen(dbOrTx);
    }

    /**
     * Open a new cash register for the day
     */
    static async open(openingBalance: number, userId: string, dbOrTx?: any): Promise<string> {
        return await accountingService.openRegister(openingBalance, userId, dbOrTx);
    }

    /**
     * Record a transaction in the current register
     */
    static async recordTransaction(input: RecordTransactionInput, dbOrTx?: any): Promise<void> {
        await accountingService.recordCashTransaction(input, dbOrTx);
    }

    /**
     * Record an expense with threshold approval check
     */
    static async recordExpense(
        amount: number,
        category: string,
        description: string,
        userId: string,
        userRoles: string[],
        dbOrTx?: any
    ) {
        await accountingService.recordCashExpense(amount, category, description, userId, userRoles, dbOrTx);
    }

    static async getActiveSession(dbOrTx?: any) {
        return await accountingService.getCurrentRegister(dbOrTx);
    }

    /**
     * Close the current register
     */
    static async close(actualClosing: number, notes: string, userId: string, reservation?: { amount: number, targetAccountId: string, sourceAccountId?: string }, dbOrTx?: any): Promise<{ difference: number }> {
        return await accountingService.closeRegister(actualClosing, notes, userId, reservation, dbOrTx);
    }

    /**
     * Get register history
     */
    static async getHistory(startDate?: string, endDate?: string, limit = 30, dbOrTx?: any) {
        return await accountingService.getRegisterHistory({ startDate, endDate, limit }, dbOrTx);
    }

    /**
     * Get summary for a register
     */
    static async getSummary(registerId: string, dbOrTx?: any) {
        return await accountingService.getRegisterSummary(registerId, dbOrTx);
    }

    /**
     * Get today's progress (for dashboard)
     */
    static async getTodayProgress(dbOrTx?: any) {
        return await accountingService.getTodayRegisterProgress(dbOrTx);
    }
}

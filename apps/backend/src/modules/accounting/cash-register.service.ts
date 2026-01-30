import { db } from "../../db";
import { cashRegisters, cashRegisterTransactions } from "../../db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { AuditService } from "./audit.service";

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
     * Generate register ID
     */
    private static generateId(): string {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
        return `REG-${dateStr}-${Date.now().toString(36).toUpperCase()}`;
    }

    /**
     * Get current open register
     */
    static async getCurrentRegister() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [register] = await db
            .select()
            .from(cashRegisters)
            .where(
                and(
                    eq(cashRegisters.status, "open"),
                    gte(cashRegisters.date, today)
                )
            )
            .orderBy(desc(cashRegisters.openedAt))
            .limit(1);

        if (!register) return null;

        // Get transactions for this register
        const transactions = await db
            .select()
            .from(cashRegisterTransactions)
            .where(eq(cashRegisterTransactions.registerId, register.id))
            .orderBy(desc(cashRegisterTransactions.createdAt));

        return { ...register, transactions };
    }

    /**
     * Check if register is open
     */
    static async isRegisterOpen(): Promise<boolean> {
        const register = await this.getCurrentRegister();
        return register !== null;
    }

    /**
     * Open a new cash register for the day
     */
    static async open(openingBalance: number, userId: string): Promise<string> {
        // Check if there's already an open register
        const existing = await this.getCurrentRegister();
        if (existing) {
            throw new Error("A register is already open. Please close it first.");
        }

        const id = this.generateId();

        await db.insert(cashRegisters).values({
            id,
            date: new Date(),
            openedBy: userId,
            openingBalance,
            expectedClosing: openingBalance, // Will be updated as transactions come in
            status: "open",
        });

        await AuditService.log({
            userId,
            action: "CREATE",
            entityType: "cash_register",
            entityId: id,
            tableName: "cash_registers",
            newValues: { openingBalance, status: "open" },
        });

        return id;
    }

    /**
     * Record a transaction in the current register
     */
    static async recordTransaction(input: RecordTransactionInput): Promise<void> {
        const register = await this.getCurrentRegister();

        if (!register) {
            throw new Error("No register is open. Please open a register first.");
        }

        // Only record cash transactions (not transfers)
        if (input.paymentMethod.toLowerCase() !== "cash" &&
            input.paymentMethod.toLowerCase() !== "tunai") {
            return; // Transfer transactions don't affect cash register
        }

        await db.insert(cashRegisterTransactions).values({
            registerId: register.id,
            transactionType: input.transactionType,
            transactionId: input.transactionId,
            paymentMethod: input.paymentMethod,
            amount: input.amount, // positive = in, negative = out
            description: input.description,
        });

        // Update expected closing
        await db
            .update(cashRegisters)
            .set({
                expectedClosing: sql`${cashRegisters.expectedClosing} + ${input.amount}`,
            })
            .where(eq(cashRegisters.id, register.id));
    }

    /**
     * Close the current register
     */
    static async close(actualClosing: number, notes: string, userId: string, reservation?: { amount: number, targetAccountId: string, sourceAccountId?: string }): Promise<{ difference: number }> {
        const register = await this.getCurrentRegister();

        const { JournalService } = await import("./journal.service");

        if (!register) {
            throw new Error("No register is open.");
        }

        const difference = actualClosing - register.expectedClosing;

        await db
            .update(cashRegisters)
            .set({
                status: "closed",
                closedBy: userId,
                closedAt: new Date(),
                actualClosing,
                difference,
                notes,
            })
            .where(eq(cashRegisters.id, register.id));

        await AuditService.log({
            userId,
            action: "CLOSE",
            entityType: "cash_register",
            entityId: register.id,
            tableName: "cash_registers",
            oldValues: { status: "open", expectedClosing: register.expectedClosing },
            newValues: { status: "closed", actualClosing, difference },
        });

        // Handle automated reservation if requested
        if (reservation && reservation.amount > 0 && reservation.targetAccountId) {
            const sourceId = reservation.sourceAccountId || "1-1001"; // Default to Kas Toko
            await JournalService.create({
                description: `Penyisihan Cadangan Harian (${new Date().toLocaleDateString('id-ID')})`,
                referenceType: "adjustment",
                lines: [
                    { accountId: reservation.targetAccountId, debit: reservation.amount, credit: 0, description: "Penyisihan dana cadangan" },
                    { accountId: sourceId, debit: 0, credit: reservation.amount, description: "Pemindahan ke dana cadangan" },
                ],
            }, userId);
        }

        return { difference };
    }

    /**
     * Get register history
     */
    static async getHistory(startDate?: string, endDate?: string, limit = 30) {
        const conditions = [];

        if (startDate) {
            conditions.push(gte(cashRegisters.date, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(cashRegisters.date, new Date(endDate)));
        }

        const query = db
            .select()
            .from(cashRegisters)
            .orderBy(desc(cashRegisters.date))
            .limit(limit);

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }

    /**
     * Get summary for a register
     */
    static async getSummary(registerId: string) {
        const transactions = await db
            .select()
            .from(cashRegisterTransactions)
            .where(eq(cashRegisterTransactions.registerId, registerId));

        const summary: Record<TransactionType, { count: number; total: number }> = {
            sale: { count: 0, total: 0 },
            service: { count: 0, total: 0 },
            expense: { count: 0, total: 0 },
            refund: { count: 0, total: 0 },
            adjustment: { count: 0, total: 0 },
        };

        for (const tx of transactions) {
            const type = tx.transactionType as TransactionType;
            summary[type].count++;
            summary[type].total += tx.amount;
        }

        return {
            transactionCount: transactions.length,
            byType: summary,
            totalIn: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            totalOut: transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        };
    }

    /**
     * Get today's progress (for dashboard)
     */
    static async getTodayProgress() {
        const register = await this.getCurrentRegister();

        if (!register) {
            return { isOpen: false, progress: 0, totalSales: 0, totalServices: 0 };
        }

        const summary = await this.getSummary(register.id);

        return {
            isOpen: true,
            registerId: register.id,
            openingBalance: register.openingBalance,
            expectedClosing: register.expectedClosing,
            totalSales: summary.byType.sale.total,
            totalServices: summary.byType.service.total,
            totalExpenses: Math.abs(summary.byType.expense.total),
            transactionCount: summary.transactionCount,
        };
    }
}

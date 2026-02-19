import { db } from "../../../db";
import { cashRegisters, cashRegisterTransactions } from "../../../db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { AuditService } from "./audit.service";
import { CashRegisterModel } from "../models/cash-register.model";

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
    static async getCurrentRegister(dbOrTx?: any) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const register = await CashRegisterModel.findOpen(today, dbOrTx);

        if (!register) return null;

        // Get transactions for this register
        const transactions = await CashRegisterModel.findTransactions(register.id, dbOrTx);

        return { ...register, transactions };
    }

    /**
     * Check if register is open
     */
    static async isRegisterOpen(dbOrTx?: any): Promise<boolean> {
        const register = await this.getCurrentRegister(dbOrTx);
        return register !== null;
    }

    /**
     * Open a new cash register for the day
     */
    static async open(openingBalance: number, userId: string, dbOrTx?: any): Promise<string> {
        const effectiveDb = dbOrTx || db;
        return await effectiveDb.transaction(async (tx: any) => {
            // Check if there's already an open register
            const existing = await this.getCurrentRegister(tx);
            if (existing) {
                throw new Error("A register is already open. Please close it first.");
            }

            const id = this.generateId();

            await CashRegisterModel.create({
                id,
                date: new Date(),
                openedBy: userId,
                openingBalance,
                expectedClosing: openingBalance, // Will be updated as transactions come in
                status: "open",
            }, tx);

            await AuditService.log({
                userId,
                action: "CREATE",
                entityType: "cash_register",
                entityId: id,
                tableName: "cash_registers",
                newValues: { openingBalance, status: "open" },
            });

            return id;
        });
    }


    /**
     * Record a transaction in the current register
     */
    static async recordTransaction(input: RecordTransactionInput, dbOrTx?: any): Promise<void> {
        const effectiveDb = dbOrTx || db;
        await effectiveDb.transaction(async (tx: any) => {
            const register = await this.getCurrentRegister(tx);

            if (!register) {
                // For expenses, we might allow recording even if register is closed? 
                // No, user requested expense to be linked to session.
                throw new Error("No register is open. Please open a register first.");
            }

            // Only record cash transactions (not transfers)
            if (input.paymentMethod.toLowerCase() !== "cash" &&
                input.paymentMethod.toLowerCase() !== "tunai") {
                return; // Transfer transactions don't affect cash register
            }

            await tx.insert(cashRegisterTransactions).values({
                registerId: register.id,
                transactionType: input.transactionType,
                transactionId: input.transactionId,
                paymentMethod: input.paymentMethod,
                amount: input.amount, // positive = in, negative = out
                description: input.description,
            });

            // Update expected closing
            await tx
                .update(cashRegisters)
                .set({
                    expectedClosing: sql`${cashRegisters.expectedClosing} + ${input.amount}`,
                })
                .where(eq(cashRegisters.id, register.id));
        });
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
        // 1. Check threshold
        // TODO: Get from settings table
        const EXPENSE_THRESHOLD = 500000;

        const requiresApproval = amount > EXPENSE_THRESHOLD;
        const canApprove = userRoles.includes("manager") || userRoles.includes("owner");

        if (requiresApproval && !canApprove) {
            throw new Error(`Pengeluaran di atas Rp ${EXPENSE_THRESHOLD.toLocaleString()} membutuhkan persetujuan Manager/Owner.`);
        }

        // 2. Record transaction
        // Expense is negative amount in register
        await this.recordTransaction({
            transactionType: "expense",
            paymentMethod: "cash", // Expenses from register are always cash
            amount: -amount,
            description: `[${category}] ${description}`,
        }, dbOrTx);

        // 3. Create operational_cost record (linked to register via created_at approximation or specific link if we add column)
        // For now, operational_costs table exists, so we should insert there too
        // We'll let the controller handle calling both services
    }

    static async getActiveSession(dbOrTx?: any) {
        return await this.getCurrentRegister(dbOrTx);
    }

    /**
     * Close the current register
     */
    static async close(actualClosing: number, notes: string, userId: string, reservation?: { amount: number, targetAccountId: string, sourceAccountId?: string }, dbOrTx?: any): Promise<{ difference: number }> {
        const effectiveDb = dbOrTx || db;
        return await effectiveDb.transaction(async (tx: any) => {
            const register = await this.getCurrentRegister(tx);

            const { JournalService } = await import("./journal.service");

            if (!register) {
                throw new Error("No register is open.");
            }

            const difference = actualClosing - register.expectedClosing;

            await tx
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
                }, userId, tx);
            }

            return { difference };
        });
    }

    /**
     * Get register history
     */
    static async getHistory(startDate?: string, endDate?: string, limit = 30, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const conditions = [];

        if (startDate) {
            conditions.push(gte(cashRegisters.date, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(cashRegisters.date, new Date(endDate)));
        }

        const query = effectiveDb
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
    static async getSummary(registerId: string, dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const transactions = await effectiveDb
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

        for (const tx of transactions as any[]) {
            const type = tx.transactionType as TransactionType;
            summary[type].count++;
            summary[type].total += tx.amount;
        }

        return {
            transactionCount: transactions.length,
            byType: summary,
            totalIn: (transactions as any[]).filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            totalOut: (transactions as any[]).filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        };
    }

    /**
     * Get today's progress (for dashboard)
     */
    static async getTodayProgress(dbOrTx?: any) {
        const effectiveDb = dbOrTx || db;
        const register = await this.getCurrentRegister(effectiveDb);

        if (!register) {
            return { isOpen: false, progress: 0, totalSales: 0, totalServices: 0 };
        }

        const summary = await this.getSummary(register.id, dbOrTx);

        return {
            isOpen: true,
            registerId: register.id,
            openingBalance: register.openingBalance,
            expectedClosing: register.expectedClosing,
            totalSales: summary.byType.sale.total,
            totalServices: summary.byType.service.total,
            totalExpenses: Math.abs(summary.byType.expense.total),
            transactionCount: summary.transactionCount,
            recentTransactions: (await effectiveDb
                .select()
                .from(cashRegisterTransactions)
                .where(eq(cashRegisterTransactions.registerId, register.id))
                .orderBy(desc(cashRegisterTransactions.createdAt))
                .limit(10)) as any[]
        };
    }
}


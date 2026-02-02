import { db } from "../../../db";
import { cashRegisters, cashRegisterTransactions } from "../../../db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export class CashRegisterModel {
    static async findOpen(today: Date, dbOrTx: any = db) {
        const [register] = await dbOrTx
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
        return register;
    }

    static async findTransactions(registerId: string, dbOrTx: any = db) {
        return dbOrTx
            .select()
            .from(cashRegisterTransactions)
            .where(eq(cashRegisterTransactions.registerId, registerId))
            .orderBy(desc(cashRegisterTransactions.createdAt));
    }

    static async create(data: any, dbOrTx: any = db) {
        return dbOrTx.insert(cashRegisters).values(data);
    }

    static async update(id: string, data: any, dbOrTx: any = db) {
        return dbOrTx.update(cashRegisters).set(data).where(eq(cashRegisters.id, id));
    }

    static async insertTransaction(data: any, dbOrTx: any = db) {
        return dbOrTx.insert(cashRegisterTransactions).values(data);
    }

    static async findById(id: string, dbOrTx: any = db) {
        const [register] = await dbOrTx
            .select()
            .from(cashRegisters)
            .where(eq(cashRegisters.id, id));
        return register;
    }
}

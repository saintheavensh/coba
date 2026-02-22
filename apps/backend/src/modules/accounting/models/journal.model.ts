import { db } from "../../../db";
import { journals, journalLines, accounts } from "../../../db/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export class JournalModel {
    static async findAll(filters: any, dbOrTx: any = db) {
        let where = and();
        if (filters.startDate) where = and(where, gte(journals.date, new Date(filters.startDate)));
        if (filters.endDate) where = and(where, lte(journals.date, new Date(filters.endDate)));
        if (filters.referenceType) where = and(where, eq(journals.referenceType, filters.referenceType));
        if (filters.referenceId) where = and(where, eq(journals.referenceId, filters.referenceId));
        if (filters.status) where = and(where, eq(journals.status, filters.status));

        return dbOrTx
            .select()
            .from(journals)
            .where(where)
            .orderBy(desc(journals.date))
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);
    }

    static async findById(id: string, dbOrTx: any = db) {
        const [journal] = await dbOrTx
            .select()
            .from(journals)
            .where(eq(journals.id, id));

        if (!journal) return null;

        const lines = await dbOrTx
            .select({
                id: journalLines.id,
                accountId: journalLines.accountId,
                accountName: accounts.name,
                accountCode: accounts.code,
                debit: journalLines.debit,
                credit: journalLines.credit,
                description: journalLines.description,
            })
            .from(journalLines)
            .leftJoin(accounts, eq(journalLines.accountId, accounts.id))
            .where(eq(journalLines.journalId, id));

        return { ...journal, lines };
    }

    static async countToday(prefix: string, dbOrTx: any = db) {
        const result = await dbOrTx
            .select({ count: sql<number>`count(*)` })
            .from(journals)
            .where(sql`${journals.id} LIKE ${prefix + '%'}`);
        return Number(result[0]?.count || 0);
    }

    static async create(data: any, dbOrTx: any = db) {
        return dbOrTx.insert(journals).values(data);
    }

    static async createLine(data: any, dbOrTx: any = db) {
        return dbOrTx.insert(journalLines).values(data);
    }

    static async update(id: string, data: any, dbOrTx: any = db) {
        return dbOrTx.update(journals).set(data).where(eq(journals.id, id));
    }

    static async deleteLinesByJournalId(journalId: string, dbOrTx: any = db) {
        return dbOrTx.delete(journalLines).where(eq(journalLines.journalId, journalId));
    }

    static async delete(id: string, dbOrTx: any = db) {
        return dbOrTx.delete(journals).where(eq(journals.id, id));
    }
}

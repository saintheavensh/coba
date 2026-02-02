import { db } from "../../../db";
import { operationalCosts } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

export class OperationalCostsModel {
    async findAll(limit = 100, dbOrTx: any = db) {
        return await dbOrTx.select()
            .from(operationalCosts)
            .orderBy(desc(operationalCosts.date))
            .limit(limit);
    }

    async create(data: typeof operationalCosts.$inferInsert, dbOrTx: any = db) {
        const [result] = await dbOrTx.insert(operationalCosts).values(data).returning({ id: operationalCosts.id });
        return result;
    }

    async delete(id: number, dbOrTx: any = db) {
        return await dbOrTx.delete(operationalCosts).where(eq(operationalCosts.id, id));
    }
}

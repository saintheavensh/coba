import { eq, desc } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { operationalCosts } from "../../../../db/schema";
import { IOperationalCostRepository, OperationalCost } from "../../domain";

export class OperationalCostRepositoryAdapter implements IOperationalCostRepository {
    async findAll(limit: number = 100, dbOrTx?: DBContext): Promise<OperationalCost[]> {
        const client = (dbOrTx as any) || db;
        const results = await client.select()
            .from(operationalCosts)
            .orderBy(desc(operationalCosts.date))
            .limit(limit);
        return results as OperationalCost[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<OperationalCost | null> {
        const client = (dbOrTx as any) || db;
        // Drizzle select().from().where() returns an array
        const [result] = await client.select()
            .from(operationalCosts)
            .where(eq(operationalCosts.id, id));
        return (result as OperationalCost) || null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<{ id: string }> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(operationalCosts).values(data).returning({ id: operationalCosts.id });
        return { id: result.id.toString() };
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(operationalCosts)
            .set(data)
            .where(eq(operationalCosts.id, id));
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(operationalCosts).where(eq(operationalCosts.id, id));
    }
}

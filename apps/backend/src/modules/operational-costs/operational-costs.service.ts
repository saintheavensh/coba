import { db } from "../../db";
import { operationalCosts } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class OperationalCostsService {
    async getAll() {
        // Return latest 100 records
        return await db.select()
            .from(operationalCosts)
            .orderBy(desc(operationalCosts.date))
            .limit(100);
    }

    async create(data: any, userId?: string) {
        const newData = {
            category: data.category,
            amount: Number(data.amount) || 0,
            date: data.date ? new Date(data.date) : new Date(),
            description: data.description,
            userId: userId || null
        };
        await db.insert(operationalCosts).values(newData);
        return { message: "Created" };
    }

    async delete(id: number) {
        await db.delete(operationalCosts).where(eq(operationalCosts.id, id));
        return { message: "Deleted" };
    }
}

import { eq, desc } from "drizzle-orm";
import { db } from "../../../../db";
import { deadPhonePurchases, gamblingTestLogs } from "../schema/GamblingSchema";
import { IGamblingRepository, DeadPhonePurchase, DeadPhoneStatus } from "../../domain/repositories/gambling-repository.port";

export class GamblingRepositoryAdapter implements IGamblingRepository {
    async savePurchase(purchase: Partial<DeadPhonePurchase>): Promise<DeadPhonePurchase> {
        const [result] = await db.insert(deadPhonePurchases).values(purchase as any).returning();
        return result as any;
    }

    async saveTestLog(log: any): Promise<any> {
        const [result] = await db.insert(gamblingTestLogs).values(log).returning();
        return result;
    }

    async findById(id: string): Promise<DeadPhonePurchase | null> {
        const result = await db.query.deadPhonePurchases.findFirst({
            where: eq(deadPhonePurchases.id, id)
        });
        return (result as any) || null;
    }

    async findAll(_filters?: any): Promise<DeadPhonePurchase[]> {
        return await db.query.deadPhonePurchases.findMany({
            orderBy: [desc(deadPhonePurchases.createdAt)]
        }) as any[];
    }

    async updateStatus(id: string, status: DeadPhoneStatus): Promise<void> {
        await db.update(deadPhonePurchases)
            .set({ status })
            .where(eq(deadPhonePurchases.id, id));
    }
}

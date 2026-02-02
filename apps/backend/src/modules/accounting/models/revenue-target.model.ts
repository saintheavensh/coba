import { db } from "../../../db";
import { revenueTargets } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class RevenueTargetModel {
    static async findByMonth(month: string) {
        const [target] = await db
            .select()
            .from(revenueTargets)
            .where(eq(revenueTargets.month, month));
        return target;
    }

    static async upsert(data: any) {
        return db.insert(revenueTargets)
            .values(data)
            .onConflictDoUpdate({
                target: revenueTargets.month,
                set: data
            });
    }

    static async findAll() {
        return db.select().from(revenueTargets).orderBy(revenueTargets.month);
    }
}

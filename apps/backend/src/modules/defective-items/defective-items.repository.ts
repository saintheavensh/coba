import { db } from "../../db";
import { defectiveItems, productBatches, products, suppliers } from "../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export class DefectiveItemsRepository {
    async create(data: typeof defectiveItems.$inferInsert) {
        const [result] = await db.insert(defectiveItems).values(data).returning();
        return result;
    }

    async findAll(status = "pending") {
        return await db.query.defectiveItems.findMany({
            where: eq(defectiveItems.status, status),
            with: {
                product: true,
                batch: {
                    with: {
                        supplier: true
                    }
                },
                supplier: true
            },
            orderBy: [desc(defectiveItems.createdAt)]
        });
    }

    async findByIds(ids: string[]) {
        return await db.query.defectiveItems.findMany({
            where: inArray(defectiveItems.id, ids),
            with: {
                batch: true
            }
        });
    }

    async updateStatus(ids: string[], status: string) {
        return await db.update(defectiveItems)
            .set({ status })
            .where(inArray(defectiveItems.id, ids))
            .returning();
    }
}

import { db } from "../../db";
import { suppliers } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class SuppliersRepository {
    async findAll() {
        return await db.query.suppliers.findMany({
            orderBy: [desc(suppliers.createdAt)],
        });
    }

    async findById(id: string) {
        return await db.query.suppliers.findFirst({
            where: eq(suppliers.id, id)
        });
    }

    async create(data: typeof suppliers.$inferInsert) {
        return await db.insert(suppliers).values(data).returning();
    }

    async update(id: string, data: Partial<typeof suppliers.$inferInsert>) {
        return await db.update(suppliers)
            .set(data)
            .where(eq(suppliers.id, id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(suppliers).where(eq(suppliers.id, id));
    }
}

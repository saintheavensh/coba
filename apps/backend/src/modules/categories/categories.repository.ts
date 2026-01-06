import { db } from "../../db";
import { categories } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class CategoriesRepository {
    async findAll() {
        return await db.query.categories.findMany({
            orderBy: [desc(categories.name)],
        });
    }

    async create(data: typeof categories.$inferInsert) {
        return await db.insert(categories).values(data).returning();
    }

    async update(id: string, data: Partial<typeof categories.$inferInsert>) {
        return await db.update(categories)
            .set(data)
            .where(eq(categories.id, id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(categories).where(eq(categories.id, id));
    }
}

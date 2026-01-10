import { eq, like, or, desc } from "drizzle-orm";
import { db } from "../../db";
import { members } from "../../db/schema";

export class CustomersRepository {
    async findAll(query?: string) {
        if (!query) {
            return await db.query.members.findMany({
                orderBy: [desc(members.createdAt)]
            });
        }

        return await db.query.members.findMany({
            where: or(
                like(members.name, `%${query}%`),
                like(members.phone, `%${query}%`)
            ),
            orderBy: [desc(members.createdAt)]
        });
    }

    async findById(id: string) {
        return await db.query.members.findFirst({
            where: eq(members.id, id)
        });
    }

    async findByPhone(phone: string) {
        return await db.query.members.findFirst({
            where: eq(members.phone, phone)
        });
    }

    async create(data: typeof members.$inferInsert) {
        return await db.insert(members).values(data).returning();
    }

    async update(id: string, data: Partial<typeof members.$inferInsert>) {
        return await db.update(members)
            .set(data)
            .where(eq(members.id, id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(members).where(eq(members.id, id));
    }

    async findSales(memberId: string) {
        return await db.query.sales.findMany({
            where: (sales, { eq }) => eq(sales.memberId, memberId),
            orderBy: (sales, { desc }) => [desc(sales.createdAt)],
            with: {
                payments: true
            }
        });
    }

    async findUnpaidSales(memberId: string) {
        // Find sales where status is 'unpaid' or 'partial' AND memberId matches
        return await db.query.sales.findMany({
            where: (sales, { eq, or, and }) => and(
                eq(sales.memberId, memberId),
                or(eq(sales.paymentStatus, "unpaid"), eq(sales.paymentStatus, "partial"))
            ),
            orderBy: (sales, { desc }) => [desc(sales.createdAt)],
            with: {
                payments: true
            }
        });
    }
}

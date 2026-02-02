import { eq, like, or, desc } from "drizzle-orm";
import { db } from "../../../db";
import { members } from "../../../db/schema";

export class CustomersModel {
    async findAll(query?: string, dbOrTx: any = db) {
        if (!query) {
            return await dbOrTx.query.members.findMany({
                orderBy: [desc(members.createdAt)]
            });
        }

        return await dbOrTx.query.members.findMany({
            where: or(
                like(members.name, `%${query}%`),
                like(members.phone, `%${query}%`)
            ),
            orderBy: [desc(members.createdAt)]
        });
    }

    async findById(id: string, dbOrTx: any = db) {
        return await dbOrTx.query.members.findFirst({
            where: eq(members.id, id)
        });
    }

    async findByPhone(phone: string, dbOrTx: any = db) {
        return await dbOrTx.query.members.findFirst({
            where: eq(members.phone, phone)
        });
    }

    async create(data: typeof members.$inferInsert, dbOrTx: any = db) {
        return await dbOrTx.insert(members).values(data).returning();
    }

    async update(id: string, data: Partial<typeof members.$inferInsert>, dbOrTx: any = db) {
        return await dbOrTx.update(members)
            .set(data)
            .where(eq(members.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx: any = db) {
        return await dbOrTx.delete(members).where(eq(members.id, id));
    }

    async findSales(memberId: string, dbOrTx: any = db) {
        return await dbOrTx.query.sales.findMany({
            where: (sales: any, { eq }: any) => eq(sales.memberId, memberId),
            orderBy: (sales: any, { desc }: any) => [desc(sales.createdAt)],
            with: {
                payments: true
            }
        });
    }

    async findUnpaidSales(memberId: string, dbOrTx: any = db) {
        // Find sales where status is 'unpaid' or 'partial' AND memberId matches
        return await dbOrTx.query.sales.findMany({
            where: (sales: any, { eq, or, and }: any) => and(
                eq(sales.memberId, memberId),
                or(eq(sales.paymentStatus, "unpaid"), eq(sales.paymentStatus, "partial"))
            ),
            orderBy: (sales: any, { desc }: any) => [desc(sales.createdAt)],
            with: {
                payments: true
            }
        });
    }
}

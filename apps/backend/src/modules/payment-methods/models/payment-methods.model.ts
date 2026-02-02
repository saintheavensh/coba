import { db } from "../../../db";
import { paymentMethods, paymentVariants } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class PaymentMethodsModel {
    async findAll() {
        return db.query.paymentMethods.findMany({
            with: { variants: true },
            orderBy: (pm, { asc }) => [asc(pm.createdAt)],
        });
    }

    async findEnabled() {
        return await db.query.paymentMethods.findMany({
            where: eq(paymentMethods.enabled, true),
            with: {
                variants: {
                    where: eq(paymentVariants.enabled, true),
                },
            },
            orderBy: (pm, { asc }) => [asc(pm.createdAt)],
        });
    }

    async findById(id: string) {
        return db.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, id),
            with: { variants: true },
        });
    }

    async create(data: typeof paymentMethods.$inferInsert) {
        await db.insert(paymentMethods).values(data);
        return await this.findById(data.id);
    }

    async update(id: string, data: Partial<typeof paymentMethods.$inferInsert>) {
        await db.update(paymentMethods)
            .set(data)
            .where(eq(paymentMethods.id, id));
        return await this.findById(id);
    }

    async createVariant(data: typeof paymentVariants.$inferInsert) {
        await db.insert(paymentVariants).values(data);
    }

    async updateVariant(id: string, data: Partial<typeof paymentVariants.$inferInsert>) {
        await db.update(paymentVariants)
            .set(data)
            .where(eq(paymentVariants.id, id));
    }
}

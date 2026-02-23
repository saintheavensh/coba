import { eq, asc } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { paymentMethods, paymentVariants } from "../../../../db/schema";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";

export class PaymentMethodRepositoryAdapter implements IPaymentMethodRepository {
    async findAll(dbOrTx?: DBContext): Promise<PaymentMethod[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.paymentMethods.findMany({
            with: { variants: true },
            orderBy: [asc(paymentMethods.createdAt)],
        }) as PaymentMethod[];
    }

    async findEnabled(dbOrTx?: DBContext): Promise<PaymentMethod[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.paymentMethods.findMany({
            where: eq(paymentMethods.enabled, true),
            with: {
                variants: {
                    where: eq(paymentVariants.enabled, true),
                },
            },
            orderBy: [asc(paymentMethods.createdAt)],
        }) as PaymentMethod[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<PaymentMethod | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, id),
            with: { variants: true },
        });
        return (result as PaymentMethod) || null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<PaymentMethod> {
        const client = (dbOrTx as any) || db;
        await client.insert(paymentMethods).values(data);
        return (await this.findById(data.id, dbOrTx)) as PaymentMethod;
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<PaymentMethod> {
        const client = (dbOrTx as any) || db;
        await client.update(paymentMethods)
            .set(data)
            .where(eq(paymentMethods.id, id));
        return (await this.findById(id, dbOrTx)) as PaymentMethod;
    }

    async createVariant(data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.insert(paymentVariants).values(data);
    }

    async updateVariant(id: string, data: any, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.update(paymentVariants)
            .set(data)
            .where(eq(paymentVariants.id, id));
    }

    async findVariantById(id: string, dbOrTx?: DBContext): Promise<any> {
        const client = (dbOrTx as any) || db;
        return await client.query.paymentVariants.findFirst({
            where: eq(paymentVariants.id, id)
        });
    }
}

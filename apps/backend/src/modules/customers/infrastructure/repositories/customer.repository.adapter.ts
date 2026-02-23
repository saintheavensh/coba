import { eq, or, like, desc, and } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { members, sales } from "../../../../db/schema";
import { ICustomerRepository, Customer, CustomerSale } from "../../domain";

export class CustomerRepositoryAdapter implements ICustomerRepository {
    async findAll(query?: string, dbOrTx?: DBContext): Promise<Customer[]> {
        const client = (dbOrTx as any) || db;
        if (!query) {
            return await client.query.members.findMany({
                orderBy: [desc(members.createdAt)]
            }) as Customer[];
        }

        return await client.query.members.findMany({
            where: or(
                like(members.name, `%${query}%`),
                like(members.phone, `%${query}%`)
            ),
            orderBy: [desc(members.createdAt)]
        }) as Customer[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Customer | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.members.findFirst({
            where: eq(members.id, id)
        });
        return (result as Customer) || null;
    }

    async findByPhone(phone: string, dbOrTx?: DBContext): Promise<Customer | null> {
        const client = (dbOrTx as any) || db;
        const result = await client.query.members.findFirst({
            where: eq(members.phone, phone)
        });
        return (result as Customer) || null;
    }

    async create(data: any, dbOrTx?: DBContext): Promise<Customer> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.insert(members).values(data).returning();
        return result as Customer;
    }

    async update(id: string, data: any, dbOrTx?: DBContext): Promise<Customer> {
        const client = (dbOrTx as any) || db;
        const [result] = await client.update(members)
            .set(data)
            .where(eq(members.id, id))
            .returning();
        return result as Customer;
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        await client.delete(members).where(eq(members.id, id));
    }

    async findSales(memberId: string, dbOrTx?: DBContext): Promise<CustomerSale[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.sales.findMany({
            where: eq(sales.memberId, memberId),
            orderBy: [desc(sales.createdAt)],
            with: {
                payments: true
            }
        }) as CustomerSale[];
    }

    async findUnpaidSales(memberId: string, dbOrTx?: DBContext): Promise<CustomerSale[]> {
        const client = (dbOrTx as any) || db;
        return await client.query.sales.findMany({
            where: and(
                eq(sales.memberId, memberId),
                or(eq(sales.paymentStatus, "unpaid"), eq(sales.paymentStatus, "partial"))
            ),
            orderBy: [desc(sales.createdAt)],
            with: {
                payments: true
            }
        }) as CustomerSale[];
    }
}

import { v4 as uuidv4 } from "uuid";
import { CustomersRepository } from "./customers.repository";
import { members, sales, salePayments } from "../../db/schema";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db";
import { eq } from "drizzle-orm";


export class CustomersService {
    private repository: CustomersRepository;

    constructor() {
        this.repository = new CustomersRepository();
    }

    async getAll(query?: string) {
        return await this.repository.findAll(query);
    }

    async getById(id: string) {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }
        return customer;
    }

    async create(data: Omit<typeof members.$inferInsert, "id" | "createdAt" | "points" | "debt">) {
        // Check duplicate phone
        const existing = await this.repository.findByPhone(data.phone);
        if (existing) {
            throw new HTTPException(400, { message: "Phone number already registered" });
        }

        const id = `CUST-${uuidv4().substring(0, 8).toUpperCase()}`; // CUST-XXXXXXXX

        const [customer] = await this.repository.create({
            ...data,
            id,
            points: 0,
            debt: 0
        });

        return customer;
    }

    async update(id: string, data: Partial<typeof members.$inferInsert>) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }

        if (data.phone && data.phone !== existing.phone) {
            const phoneCheck = await this.repository.findByPhone(data.phone);
            if (phoneCheck) {
                throw new HTTPException(400, { message: "Phone number already registered" });
            }
        }

        const [updated] = await this.repository.update(id, data);
        return updated;
    }

    async delete(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }
        await this.repository.delete(id);
        return { success: true };
    }

    async getSales(id: string) {
        return await this.repository.findSales(id);
    }

    async getUnpaidSales(id: string) {
        return await this.repository.findUnpaidSales(id);
    }

    async processPayment(id: string, amount: number, notes?: string, saleId?: string, proofImage?: string) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }

        const currentDebt = existing.debt || 0;
        if (amount > currentDebt) {
            throw new HTTPException(400, { message: `Payment (${amount}) exceeds total debt (${currentDebt})` });
        }

        return await db.transaction(async (tx) => {
            // 1. If saleId provided, validate and update Sale
            if (saleId) {
                const sale = await tx.query.sales.findFirst({
                    where: eq(sales.id, saleId)
                });

                if (!sale) throw new HTTPException(404, { message: "Invoice not found" });
                if (sale.paymentStatus === 'paid') throw new HTTPException(400, { message: "Invoice already paid" });

                // Add Payment Record
                await tx.insert(salePayments).values({
                    saleId: saleId,
                    method: proofImage ? "transfer" : "cash",
                    amount: amount,
                    reference: notes,
                    proofImage: proofImage
                });

                // Update Sale Status
                // Calculate total paid including this one
                const payments = await tx.query.salePayments.findMany({
                    where: eq(salePayments.saleId, saleId)
                });
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + amount; // +amount because txn might not see inserted yet unless flush? 
                // Wait, Drizzle inside transaction might not see previous insert if not awaited? It is awaited.
                // But safer to calculate manually:
                // const currentPaid = ...;
                // Actually if I inserted above, findMany will see it? SQLite supports read-your-writes in txn.

                // Let's re-query payments
                const allPayments = await tx.query.salePayments.findMany({
                    where: eq(salePayments.saleId, saleId)
                });
                const totalPaidReal = allPayments.reduce((sum, p) => sum + p.amount, 0);

                let status: "paid" | "partial" | "unpaid" = "partial";
                if (totalPaidReal >= sale.finalAmount) status = "paid";

                await tx.update(sales).set({ paymentStatus: status }).where(eq(sales.id, saleId));
            }

            // 2. Reduce Member Debt Logic
            const newDebt = currentDebt - amount;
            const [updated] = await tx.update(members)
                .set({ debt: newDebt })
                .where(eq(members.id, id))
                .returning();

            return updated;
        });
    }
}

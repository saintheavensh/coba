import { CustomersRepository } from "./customers.repository";
import { members, sales, salePayments } from "../../db/schema";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../lib/utils";


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

        const id = generateId(ID_PREFIX.CUSTOMER);

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

    async processPayment(id: string, amount: number, method: "cash" | "transfer" | "qris" = "cash", notes?: string, saleId?: string, proofImage?: string) {
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

                // Add Payment Record using provided method
                await tx.insert(salePayments).values({
                    saleId: saleId,
                    method: method,
                    amount: amount,
                    reference: notes,
                    proofImage: proofImage
                });

                // Update Sale Status - Calculate total paid excluding tempo payments
                const allPayments = await tx.query.salePayments.findMany({
                    where: eq(salePayments.saleId, saleId)
                });

                // Only count actual payments (cash, transfer, qris) - NOT tempo (debt)
                const totalPaidReal = allPayments
                    .filter(p => p.method !== 'tempo')
                    .reduce((sum, p) => sum + p.amount, 0);

                let status: "paid" | "partial" | "unpaid" = "unpaid";
                if (totalPaidReal >= sale.finalAmount) {
                    status = "paid";
                } else if (totalPaidReal > 0) {
                    status = "partial";
                }

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

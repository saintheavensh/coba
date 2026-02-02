import { CustomersModel } from "../models/customers.model";
import { members, sales, salePayments } from "../../../db/schema";
import { HTTPException } from "hono/http-exception";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { generateId, ID_PREFIX } from "../../../lib/utils";


export class CustomersService {
    private model: CustomersModel;

    constructor() {
        this.model = new CustomersModel();
    }

    async getAll(query?: string, dbOrTx?: any) {
        return await this.model.findAll(query, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        const customer = await this.model.findById(id, dbOrTx);
        if (!customer) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }
        return customer;
    }

    async create(data: Omit<typeof members.$inferInsert, "id" | "createdAt" | "points" | "debt">, dbOrTx?: any) {
        // Check duplicate phone
        const existing = await this.model.findByPhone(data.phone, dbOrTx);
        if (existing) {
            throw new HTTPException(400, { message: "Phone number already registered" });
        }

        const id = generateId(ID_PREFIX.CUSTOMER);

        const [customer] = await this.model.create({
            ...data,
            id,
            points: 0,
            debt: 0
        }, dbOrTx);

        return customer;
    }

    async update(id: string, data: Partial<typeof members.$inferInsert>, dbOrTx?: any) {
        const existing = await this.model.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }

        if (data.phone && data.phone !== existing.phone) {
            const phoneCheck = await this.model.findByPhone(data.phone, dbOrTx);
            if (phoneCheck) {
                throw new HTTPException(400, { message: "Phone number already registered" });
            }
        }

        const [updated] = await this.model.update(id, data, dbOrTx);
        return updated;
    }

    async delete(id: string, dbOrTx?: any) {
        const existing = await this.model.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Costumer not found" });
        }
        await this.model.delete(id, dbOrTx);
        return { success: true };
    }

    async getSales(id: string, dbOrTx?: any) {
        return await this.model.findSales(id, dbOrTx);
    }

    async getUnpaidSales(id: string, dbOrTx?: any) {
        return await this.model.findUnpaidSales(id, dbOrTx);
    }

    async processPayment(id: string, amount: number, method: "cash" | "transfer" | "qris" = "cash", notes?: string, saleId?: string, proofImage?: string) {
        const existing = await this.model.findById(id);
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
                if (totalPaidReal >= sale.totalAmount) {
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

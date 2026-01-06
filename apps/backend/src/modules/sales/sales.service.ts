import { db } from "../../db";
import { sales, saleItems, productBatches, products, activityLogs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { SalesRepository } from "./sales.repository";

export class SalesService {
    private repo: SalesRepository;

    constructor() {
        this.repo = new SalesRepository();
    }

    async getAll() {
        return await this.repo.findAll();
    }

    async createSale(data: {
        memberId?: string;
        customerName?: string;
        paymentMethod: "cash" | "transfer" | "qris";
        userId: string;
        notes?: string;
        items: {
            productId: string;
            batchId: string;
            variant?: string;
            qty: number;
            price: number;
        }[];
        discountAmount?: number;
    }) {
        const saleId = "SAL-" + Date.now().toString();
        const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const finalAmount = subtotal - (data.discountAmount || 0);

        await db.transaction(async (tx) => {
            // 1. Create Sale Header
            await tx.insert(sales).values({
                id: saleId,
                memberId: data.memberId,
                customerName: data.customerName,
                paymentMethod: data.paymentMethod,
                userId: data.userId,
                totalAmount: subtotal,
                discountAmount: data.discountAmount || 0,
                finalAmount: finalAmount < 0 ? 0 : finalAmount,
                notes: data.notes
            });

            // 2. Process Items
            for (const item of data.items) {
                const batch = await tx.query.productBatches.findFirst({
                    where: eq(productBatches.id, item.batchId)
                });

                if (!batch) throw new Error(`Batch ${item.batchId} not found`);
                if (batch.currentStock < item.qty) throw new Error(`Insufficient stock for ${batch.id}`);

                // Reduce Batch Stock
                await tx.update(productBatches)
                    .set({
                        currentStock: batch.currentStock - item.qty,
                        updatedAt: new Date()
                    })
                    .where(eq(productBatches.id, item.batchId));

                // Reduce Product Stock
                const product = await tx.query.products.findFirst({
                    where: eq(products.id, item.productId)
                });

                if (product) {
                    await tx.update(products)
                        .set({ stock: (product.stock || 0) - item.qty })
                        .where(eq(products.id, item.productId));
                }

                // Insert Item
                await tx.insert(saleItems).values({
                    saleId: saleId,
                    productId: item.productId,
                    batchId: item.batchId,
                    variant: item.variant || batch.variant,
                    qty: item.qty,
                    price: item.price,
                    subtotal: item.qty * item.price
                });
            }

            // 3. Log
            await tx.insert(activityLogs).values({
                userId: data.userId,
                action: "CREATE",
                entityType: "sale",
                entityId: saleId,
                description: `Created sale ${saleId} amount ${finalAmount}`,
                newValue: JSON.stringify(data),
                createdAt: new Date()
            });
        });

        return { message: "Sale created", id: saleId };
    }
}

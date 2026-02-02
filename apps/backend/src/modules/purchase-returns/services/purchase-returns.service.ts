import { db } from "../../../db";
import { v4 as uuidv4 } from "uuid";
import { PurchaseReturnsModel } from "../models/purchase-returns.model";
import { products, productBatches } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export class PurchaseReturnsService {
    private model: PurchaseReturnsModel;

    constructor() {
        this.model = new PurchaseReturnsModel();
    }

    async getAll(dbOrTx?: any) {
        return await this.model.findAll(dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        const item = await this.model.findById(id, dbOrTx);
        if (!item) throw new HTTPException(404, { message: "Return not found" });
        return item;
    }

    async create(data: { supplierId: string, userId: string, notes?: string, items: { batchId: string, qty: number, reason?: string }[] }, dbOrTx?: any) {
        if (!data.items || data.items.length === 0) {
            throw new HTTPException(400, { message: "No items to return" });
        }

        const effectiveDb = dbOrTx || db;
        return await effectiveDb.transaction(async (tx: any) => {
            const returnId = `RET-${uuidv4().substring(0, 8).toUpperCase()}`;

            // 1. Create Header
            await this.model.create({
                id: returnId,
                supplierId: data.supplierId,
                userId: data.userId,
                notes: data.notes
            }, tx);

            // 2. Process Items
            const itemsToInsert = [];
            for (const item of data.items) {
                // Get Batch
                const batch = await tx.query.productBatches.findFirst({
                    where: eq(productBatches.id, item.batchId)
                });

                if (!batch) throw new HTTPException(404, { message: `Batch ${item.batchId} not found` });

                // Check Stock
                if (batch.currentStock < item.qty) {
                    throw new HTTPException(400, { message: `Insufficient stock in batch ${batch.id}. Available: ${batch.currentStock}, Requested: ${item.qty}` });
                }

                // Reduce Batch Stock
                await tx.update(productBatches)
                    .set({ currentStock: batch.currentStock - item.qty })
                    .where(eq(productBatches.id, batch.id));

                // Reduce Product Global Stock
                const product = await tx.query.products.findFirst({
                    where: eq(products.id, batch.productId)
                });

                if (product) {
                    await tx.update(products)
                        .set({ stock: product.stock - item.qty })
                        .where(eq(products.id, product.id));
                }

                itemsToInsert.push({
                    returnId,
                    productId: batch.productId,
                    batchId: batch.id,
                    qty: item.qty,
                    reason: item.reason
                });
            }

            // 3. Insert Items
            await this.model.createItems(itemsToInsert, tx);

            return { id: returnId, ...data };
        });
    }
}

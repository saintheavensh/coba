import { DefectiveItemsRepository } from "./defective-items.repository";
import { db } from "../../db";
import { productBatches, purchaseReturns, purchaseReturnItems, defectiveItems } from "../../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { HTTPException } from "hono/http-exception";

export class DefectiveItemsService {
    private repository: DefectiveItemsRepository;

    constructor() {
        this.repository = new DefectiveItemsRepository();
    }

    async addItem(data: {
        productId: string;
        batchId: string;
        qty: number;
        reason: string;
        source: "manual" | "sales_return" | "service_return";
        sourceRefId?: string;
    }) {
        return await db.transaction(async (tx) => {
            // 1. Validate Batch Stock
            const batch = await tx.query.productBatches.findFirst({
                where: eq(productBatches.id, data.batchId)
            });

            if (!batch) throw new HTTPException(404, { message: "Batch not found" });
            if (batch.currentStock < data.qty) {
                throw new HTTPException(400, { message: "Insufficient stock in batch" });
            }

            // 2. Decorate with Supplier link
            if (!batch.supplierId) throw new HTTPException(400, { message: "Batch has no supplier" });

            // 3. Create Defective Item
            const id = `DEF-${uuidv4().substring(0, 8)}`;
            await tx.insert(defectiveItems).values({
                id,
                productId: data.productId,
                batchId: data.batchId,
                supplierId: batch.supplierId,
                qty: data.qty,
                source: data.source,
                sourceRefId: data.sourceRefId,
                reason: data.reason
            });

            // 4. Reduce Good Stock
            await tx.update(productBatches)
                .set({ currentStock: batch.currentStock - data.qty })
                .where(eq(productBatches.id, data.batchId));

            return { id };
        });
    }

    async getPendingItems() {
        return await this.repository.findAll("pending");
    }

    async createReturnFromItems(userId: string, itemIds: string[]) {
        if (itemIds.length === 0) throw new HTTPException(400, { message: "No items selected" });

        return await db.transaction(async (tx) => {
            // 1. Load Items
            const items = await tx.query.defectiveItems.findMany({
                where: inArray(defectiveItems.id, itemIds)
            });

            if (items.length !== itemIds.length) {
                throw new HTTPException(400, { message: "Some items not found or status mismatch" });
            }

            // 2. Validate Same Supplier
            const supplierId = items[0].supplierId;
            const differentSupplier = items.find(i => i.supplierId !== supplierId);
            if (differentSupplier) {
                throw new HTTPException(400, { message: "All items must be from the same supplier" });
            }

            // 3. Create Purchase Return Header
            const returnId = `RET-${uuidv4().substring(0, 8)}`;
            await tx.insert(purchaseReturns).values({
                id: returnId,
                supplierId: supplierId,
                userId: userId,
                date: new Date(),
                notes: "Auto-generated from Defective Items"
            });

            // 4. Create Purchase Return Items & Update Status
            for (const item of items) {
                if (item.status !== "pending") {
                    throw new HTTPException(400, { message: `Item ${item.id} is not pending` });
                }

                await tx.insert(purchaseReturnItems).values({
                    returnId: returnId,
                    productId: item.productId,
                    batchId: item.batchId,
                    qty: item.qty,
                    reason: item.reason
                });

                await tx.update(defectiveItems)
                    .set({ status: "processed" })
                    .where(eq(defectiveItems.id, item.id));
            }

            return { returnId };
        });
    }
}

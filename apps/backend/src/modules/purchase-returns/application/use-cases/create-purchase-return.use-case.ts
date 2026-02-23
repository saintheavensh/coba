import { v4 as uuidv4 } from "uuid";
import { DBContext } from "../../../../shared/types/db-context";
import {
    IPurchaseReturnRepository,
    IStockMutationGateway,
    CreatePurchaseReturnData,
    PurchaseReturn
} from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreatePurchaseReturnUseCase {
    constructor(
        private readonly repository: IPurchaseReturnRepository,
        private readonly stockGateway: IStockMutationGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(data: CreatePurchaseReturnData, dbOrTx?: DBContext): Promise<PurchaseReturn> {
        if (!data.items || data.items.length === 0) {
            throw new HTTPException(400, { message: "No items to return" });
        }

        const runInTransaction = async (tx: DBContext) => {
            const returnId = `RET-${uuidv4().substring(0, 8).toUpperCase()}`;
            const now = new Date();

            // 1. Create Return Header
            const purchaseReturn = await this.repository.create({
                id: returnId,
                supplierId: data.supplierId,
                userId: data.userId,
                notes: data.notes || null,
                date: now
            }, tx);

            const itemsToInsert = [];
            for (const item of data.items) {
                // Verify Batch Stock via Gateway
                const batch = await this.stockGateway.getBatchStock(item.batchId, tx);
                if (!batch) {
                    throw new HTTPException(404, { message: `Batch ${item.batchId} not found` });
                }

                if (batch.currentStock < item.qty) {
                    throw new HTTPException(400, {
                        message: `Insufficient stock in batch ${item.batchId}. Available: ${batch.currentStock}, Requested: ${item.qty}`
                    });
                }

                // Deduct Batch Stock via Gateway
                await this.stockGateway.deductBatchStock(item.batchId, item.qty, tx);

                // Update Product Global Stock via Gateway
                await this.stockGateway.updateProductStock(batch.productId, -item.qty, tx);

                itemsToInsert.push({
                    returnId,
                    productId: batch.productId,
                    batchId: item.batchId,
                    qty: item.qty,
                    reason: item.reason || null
                });
            }

            // 2. Insert Return Items
            await this.repository.createItems(itemsToInsert, tx);

            return { ...purchaseReturn, items: itemsToInsert as any };
        };

        if (dbOrTx) {
            return await runInTransaction(dbOrTx);
        } else {
            return await this.db.transaction(runInTransaction);
        }
    }
}

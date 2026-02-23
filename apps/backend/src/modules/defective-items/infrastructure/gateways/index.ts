import { DBContext } from "../../../../shared/types/db-context";
import { inventoryApplicationService } from "../../../inventory/inventory-container";
import { purchaseReturnsService } from "../../../purchase-returns/purchase-returns-container";
import { IInventoryGateway, IPurchaseReturnGateway } from "../../domain";

export class InventoryGatewayAdapter implements IInventoryGateway {
    async getBatch(batchId: string, dbOrTx?: DBContext): Promise<any> {
        return await inventoryApplicationService.getBatchById(batchId, dbOrTx);
    }

    async reduceStock(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void> {
        await inventoryApplicationService.reduceStock(batchId, qty, dbOrTx);
    }
}

export class PurchaseReturnGatewayAdapter implements IPurchaseReturnGateway {
    async createReturn(params: {
        supplierId: string;
        userId: string;
        items: Array<{
            productId: string;
            batchId: string;
            qty: number;
            reason: string;
        }>;
        notes?: string;
    }, dbOrTx?: DBContext): Promise<{ returnId: string }> {
        const result = await purchaseReturnsService.create(params, dbOrTx);
        return { returnId: result.id };
    }
}

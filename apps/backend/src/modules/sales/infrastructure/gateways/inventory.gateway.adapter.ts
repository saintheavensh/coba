import { DBContext } from "../../../../shared/types/db-context";
import { inventoryApplicationService } from "../../../inventory/inventory-container";
import { IInventoryGateway } from "../../domain";

export class InventoryGatewayAdapter implements IInventoryGateway {
    async deductStockFIFO(params: {
        saleId: string;
        items: {
            productId: string;
            variant: string;
            quantity: number;
            unitPrice: number;
        }[];
    }, dbOrTx?: DBContext): Promise<{ allocations: any[]; cogsAmount: number }> {
        return await inventoryApplicationService.deductStockFIFO(params, dbOrTx as any);
    }
}

import { db } from "../../db";
import {
    DefectiveItemRepositoryAdapter,
    InventoryGatewayAdapter,
    PurchaseReturnGatewayAdapter
} from "./infrastructure";
import {
    GetDefectiveItemsUseCase,
    AddDefectiveItemUseCase,
    ProcessReturnUseCase
} from "./application";
import { DefectiveItemStatus } from "./domain";

// Adapters
const repository = new DefectiveItemRepositoryAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const purchaseReturnGateway = new PurchaseReturnGatewayAdapter();

// Use Cases
const getDefectiveItemsUC = new GetDefectiveItemsUseCase(repository);
const addDefectiveItemUC = new AddDefectiveItemUseCase(repository, inventoryGateway, db as any);
const processReturnUC = new ProcessReturnUseCase(repository, purchaseReturnGateway, db as any);

/**
 * DefectiveItemsApplicationService — Facade for external and presentation layers.
 */
export class DefectiveItemsApplicationService {
    async getPendingItems() {
        return await getDefectiveItemsUC.execute("pending");
    }

    async getProcessedItems() {
        return await getDefectiveItemsUC.execute("processed");
    }

    async addItem(data: any) {
        return await addDefectiveItemUC.execute(data);
    }

    async processReturn(userId: string, itemIds: string[]) {
        return await processReturnUC.execute(userId, itemIds);
    }
}

/** Singleton instance */
export const defectiveItemsApplicationService = new DefectiveItemsApplicationService();

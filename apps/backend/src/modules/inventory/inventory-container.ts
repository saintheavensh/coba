/**
 * Inventory module composition root.
 * Wires infrastructure adapters → use cases → service facades.
 * Maintains backward-compatible exports for external consumers.
 */
import { StockMutationGatewayAdapter } from "./infrastructure/adapters/stock-mutation-gateway.adapter";
import { StockOpnameRepositoryAdapter } from "./infrastructure/adapters/stock-opname-repository.adapter";
import { ActivityLoggerAdapter } from "./infrastructure/adapters/activity-logger.adapter";
import { BatchRepositoryAdapter } from "./infrastructure/adapters/batch-repository.adapter";

import { DeductStockFIFOUseCase } from "./application/use-cases/deduct-stock-fifo.use-case";
import { AddStockFromPurchaseUseCase } from "./application/use-cases/add-stock-from-purchase.use-case";
import { ReverseStockUseCase } from "./application/use-cases/reverse-stock.use-case";
import { GetLastBatchUseCase } from "./application/use-cases/get-last-batch.use-case";
import { CreateOpnameSessionUseCase } from "./application/use-cases/create-opname-session.use-case";
import { GetOpnameSessionsUseCase } from "./application/use-cases/get-opname-sessions.use-case";
import { GetOpnameSessionDetailsUseCase } from "./application/use-cases/get-opname-session-details.use-case";
import { UpdateOpnameItemUseCase } from "./application/use-cases/update-opname-item.use-case";
import { FinalizeOpnameSessionUseCase } from "./application/use-cases/finalize-opname-session.use-case";
import { CancelOpnameSessionUseCase } from "./application/use-cases/cancel-opname-session.use-case";
import { GetAdjustmentHistoryUseCase } from "./application/use-cases/get-adjustment-history.use-case";
import { ReduceBatchStockUseCase } from "./application/use-cases/reduce-batch-stock.use-case";

import { InventoryService } from "./services/inventory.service";
import { StockOpnameService } from "./services/stock-opname.service";
import { productsService } from "../products/products-container";

// Infrastructure adapters
const stockGateway = new StockMutationGatewayAdapter();
const stockOpnameRepo = new StockOpnameRepositoryAdapter();
const activityLogger = new ActivityLoggerAdapter();
const batchRepository = new BatchRepositoryAdapter();

// Stock use cases
const deductStockFIFOUC = new DeductStockFIFOUseCase(stockGateway);
const addStockFromPurchaseUC = new AddStockFromPurchaseUseCase(stockGateway);
const reverseStockUC = new ReverseStockUseCase(stockGateway);
const getLastBatchUC = new GetLastBatchUseCase(batchRepository);
const reduceBatchStockUC = new ReduceBatchStockUseCase(stockGateway, batchRepository);

// Opname use cases
const createOpnameSessionUC = new CreateOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const getOpnameSessionsUC = new GetOpnameSessionsUseCase(stockOpnameRepo);
const getOpnameSessionDetailsUC = new GetOpnameSessionDetailsUseCase(stockOpnameRepo);
const updateOpnameItemUC = new UpdateOpnameItemUseCase(stockOpnameRepo);
const finalizeOpnameSessionUC = new FinalizeOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const cancelOpnameSessionUC = new CancelOpnameSessionUseCase(stockOpnameRepo, activityLogger);
const getAdjustmentHistoryUC = new GetAdjustmentHistoryUseCase(stockOpnameRepo);

// Service facades
export const inventoryService = new InventoryService(
    deductStockFIFOUC,
    addStockFromPurchaseUC,
    reverseStockUC,
    getLastBatchUC,
    reduceBatchStockUC,
    batchRepository,
    productsService
);

export const stockOpnameService = new StockOpnameService(
    createOpnameSessionUC,
    getOpnameSessionsUC,
    getOpnameSessionDetailsUC,
    updateOpnameItemUC,
    finalizeOpnameSessionUC,
    cancelOpnameSessionUC,
    getAdjustmentHistoryUC
);

/**
 * Backward-compatible aliases.
 * External modules (sales, purchases) import these names.
 */
export const inventoryApplicationService = inventoryService;
export const stockOpnameApplicationService = stockOpnameService;

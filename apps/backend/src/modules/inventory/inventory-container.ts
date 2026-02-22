/**
 * Composition root for the Inventory module.
 * Wires infrastructure adapters to domain ports and exposes application services.
 */
import {
    ProductRepositoryAdapter,
    VariantRepositoryAdapter,
    StockMutationGatewayAdapter,
    StockOpnameRepositoryAdapter,
    CategoryRepositoryAdapter,
    RegisterGateAdapter,
    PrintGatewayAdapter,
    ActivityLoggerAdapter
} from "./infrastructure";

import { InventoryApplicationService } from "./application/inventory-application.service";
import { StockOpnameApplicationService } from "./application/stock-opname-application.service";

// --- Inventory Application Service ---
export const inventoryApplicationService = new InventoryApplicationService({
    productRepository: new ProductRepositoryAdapter(),
    variantRepository: new VariantRepositoryAdapter(),
    stockGateway: new StockMutationGatewayAdapter(),
    registerGate: new RegisterGateAdapter(),
    categoryRepository: new CategoryRepositoryAdapter(),
    printGateway: new PrintGatewayAdapter(),
});

// --- Stock Opname Application Service ---
export const stockOpnameApplicationService = new StockOpnameApplicationService({
    stockOpnameRepository: new StockOpnameRepositoryAdapter(),
    activityLogger: new ActivityLoggerAdapter(),
});

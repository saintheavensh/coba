import { Container } from "inversify";
import { TYPES } from "./types";
import { dashboardContainer } from "./shared/presentation/dashboard/dashboard.container";
import { deviceContainer } from "./shared/infrastructure/external-api/devices/DeviceContainer";
import { configContainer } from "./shared/infrastructure/config/config.container";
import { LoggerFactory } from "./shared/utils/logger/Logger";

// Import legacy singleton facades
import { salesService } from "./modules/sales/sales-container";
import { inventoryService } from "./modules/inventory/inventory-container";
import { customersService } from "./modules/customers/customers-container";
import { storeDeviceFacade } from "./shared/infrastructure/external-api/devices";
// For products, we don't have a singleton yet, we'll need to load its container module if it exists
import { productsContainerModule } from "./modules/products/products-container";

const container = new Container();

// Load modules
container.load(dashboardContainer);
container.load(deviceContainer);
container.load(productsContainerModule);
container.load(configContainer);

import { CacheService } from "./shared/infrastructure/cache/CacheService";
container.bind<CacheService>(TYPES.CacheService).to(CacheService).inSingletonScope();

// Bind legacy facades as constants
container.bind(TYPES.SalesFacade).toConstantValue(salesService);
container.bind(TYPES.InventoryFacade).toConstantValue(inventoryService);
container.bind(TYPES.CustomersFacade).toConstantValue(customersService);
container.bind(TYPES.StoreDeviceFacade).toConstantValue(storeDeviceFacade);

// Register logger factory as singleton
container.bind<LoggerFactory>(TYPES.LoggerFactory)
    .to(LoggerFactory)
    .inSingletonScope();

// The ProductsFacade is automatically bound by productsContainerModule, but under its own TYPES.ProductsFacade.
// Since the string 'ProductsFacade' is the same, it shares the symbol.

export { container };

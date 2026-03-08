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
// For products, we don't have a singleton yet, we'll need to load its container module if it exists
import { productsContainerModule } from "./modules/products/products-container";
import { usersContainerModule } from "./modules/users/users-container";
import { suppliersContainerModule } from "./modules/suppliers/suppliers-container";
import { categoriesContainerModule } from "./modules/categories/categories.container";

const container = new Container();

// Load modules
container.load(dashboardContainer);
container.load(deviceContainer);
container.load(productsContainerModule);
container.load(usersContainerModule);
container.load(suppliersContainerModule);
container.load(categoriesContainerModule);
container.load(configContainer);

import { CacheService } from "./shared/infrastructure/cache/CacheService";
import { DrizzleClient } from "./shared/infrastructure/database/DrizzleClient";

// Global Bindings
container.bind<DrizzleClient>(TYPES.DrizzleClient).to(DrizzleClient).inSingletonScope();
container.bind<CacheService>(TYPES.CacheService).to(CacheService).inSingletonScope();

// Bind legacy facades as constants
container.bind(TYPES.SalesFacade).toConstantValue(salesService);
container.bind(TYPES.InventoryFacade).toConstantValue(inventoryService);
container.bind(TYPES.CustomersFacade).toConstantValue(customersService);

// Register logger factory as singleton
container.bind<LoggerFactory>(TYPES.LoggerFactory)
    .to(LoggerFactory)
    .inSingletonScope();

// The ProductsFacade is automatically bound by productsContainerModule, but under its own TYPES.ProductsFacade.
// Since the string 'ProductsFacade' is the same, it shares the symbol.

export { container };

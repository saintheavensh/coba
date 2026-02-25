import { ContainerModule } from "inversify";
import { TYPES } from "./types";

// Infrastructure
import { DrizzleProductRepository } from "./infrastructure/persistence/DrizzleProductRepository";
import { InventoryGatewayAdapter } from "./infrastructure/adapters/InventoryGatewayAdapter";
import { DrizzleClient } from "../../shared/infrastructure/database/DrizzleClient";

// Use Cases
import { CreateProductUseCase } from "./application/use-cases/CreateProductUseCase";
import { GetProductUseCase } from "./application/use-cases/GetProductUseCase";
import { UpdateProductUseCase } from "./application/use-cases/UpdateProductUseCase";
import { ActivateProductUseCase } from "./application/use-cases/ActivateProductUseCase";
import { DeleteProductUseCase } from "./application/use-cases/DeleteProductUseCase";

// Facade
import { ProductsFacade } from "./application/facades/ProductsFacade";

// Repository Interfaces (Ports)
import { IProductRepository } from "./domain/ports/IProductRepository";
import { IInventoryGateway } from "./domain/ports/IInventoryGateway";

/**
 * Products Module Container
 * Configures all dependencies for the Products module using Inversify.
 */
export const productsContainerModule = new ContainerModule(({ bind }) => {
    // Database
    bind<DrizzleClient>(TYPES.DrizzleClient).to(DrizzleClient).inSingletonScope();

    // External dependencies bindings required for adapters
    bind(TYPES.InventoryFacade).toDynamicValue(() => {
        // Late require to avoid circular dependency
        const { inventoryService } = require("../inventory/inventory-container");
        return inventoryService;
    }).inSingletonScope();

    // Repositories
    bind<IProductRepository>(TYPES.IProductRepository).to(DrizzleProductRepository).inSingletonScope();

    // Gateways
    bind<IInventoryGateway>(TYPES.IInventoryGateway).to(InventoryGatewayAdapter).inSingletonScope();

    // Application / Use Cases
    bind<CreateProductUseCase>(TYPES.CreateProductUseCase).to(CreateProductUseCase);
    bind<GetProductUseCase>(TYPES.GetProductsUseCase).to(GetProductUseCase);
    bind<UpdateProductUseCase>(TYPES.UpdateProductUseCase).to(UpdateProductUseCase);
    bind<DeleteProductUseCase>(TYPES.DeleteProductUseCase).to(DeleteProductUseCase);
    // Note: ActivateProductUseCase isn't in TYPES yet, let's add it if needed or bind to self
    bind<ActivateProductUseCase>(ActivateProductUseCase).toSelf();

    // Application / Facade
    bind<ProductsFacade>(TYPES.ProductsFacade).to(ProductsFacade).inSingletonScope();
});

import { Container } from "inversify";
import { LoggerFactory } from "../../shared/utils/logger/Logger";

// Exposing a singleton instance directly if external modules expect `productsService` rather than resolving from global container
const tempContainer = new Container();
tempContainer.bind(TYPES.LoggerFactory).to(LoggerFactory).inSingletonScope();
tempContainer.load(productsContainerModule);
const productsService = tempContainer.get<ProductsFacade>(TYPES.ProductsFacade);

export { ProductsFacade, productsService };

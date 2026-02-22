/**
 * Wires inventory ports to adapters and exposes the application service.
 */
import { InventoryApplicationService } from "./application/inventory-application.service";
import {
    ProductRepositoryAdapter,
    VariantRepositoryAdapter,
    StockMutationGatewayAdapter,
    RegisterGateAdapter,
    CategoryRepositoryAdapter
} from "./adapters";

const productRepository = new ProductRepositoryAdapter();
const variantRepository = new VariantRepositoryAdapter();
const stockGateway = new StockMutationGatewayAdapter();
const registerGate = new RegisterGateAdapter();
const categoryRepository = new CategoryRepositoryAdapter();

export const inventoryApplicationService = new InventoryApplicationService({
    productRepository,
    variantRepository,
    stockGateway,
    registerGate,
    categoryRepository
});

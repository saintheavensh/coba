/**
 * Barrel export for the Products domain layer.
 */

// Entities & DTOs
export type {
    ProductEntity,
    ProductBatchView,
    VariantEntity,
    InventoryStats,
    SearchResult,
    CreateProductData,
    UpdateProductData,
    CreateVariantData,
    UpdateVariantData,
    CategoryWithTemplates,
    LabelData
} from "./product.entity";

// Port interfaces
export type { IProductRepository } from "./product-repository.port";
export type { IVariantRepository } from "./variant-repository.port";
export type { ICategoryRepository } from "./category-repository.port";
export type { IRegisterGate } from "./register-gate.port";
export type { IPrintGateway } from "./print-gateway.port";

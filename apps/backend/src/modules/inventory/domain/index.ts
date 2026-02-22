/**
 * Barrel export for the Inventory domain layer.
 */

// Entities & DTOs
export type {
    ProductEntity,
    ProductBatchEntity,
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

// Stock types
export type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    DeductStockFIFOItem,
    DeductStockFIFOAllocation,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    AddStockFromPurchaseVerificationItem,
    AddStockFromPurchaseVerificationAllocation,
    ReverseStockItem,
    ReverseStockInput
} from "./stock.types";

// Port interfaces
export type { IProductRepository } from "./product-repository.port";
export type { IVariantRepository } from "./variant-repository.port";
export type { IStockMutationGateway } from "./stock-mutation-gateway.port";
export type { IRegisterGate } from "./register-gate.port";
export type { ICategoryRepository } from "./category-repository.port";
export type { IPrintGateway } from "./print-gateway.port";
export type { IActivityLogger, ActivityLogEntry } from "./activity-logger.port";
export type {
    IStockOpnameRepository,
    OpnameSessionEntity,
    OpnameItemEntity,
    OpnameBatchEntity,
    AdjustmentHistoryRow,
    InsertSessionData,
    InsertItemData
} from "./stock-opname-repository.port";

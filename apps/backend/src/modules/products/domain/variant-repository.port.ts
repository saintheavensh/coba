/**
 * Port for variant persistence and lookup.
 */
import type { VariantEntity, CreateVariantData, UpdateVariantData } from "./product.entity";

export interface IVariantRepository {
    findVariantsBySupplierConfig(supplierId: string, dbOrTx?: unknown): Promise<VariantEntity[]>;
    findVariantsByProductId(productId: string, supplierId?: string, dbOrTx?: unknown): Promise<VariantEntity[]>;
    createVariant(data: CreateVariantData, dbOrTx?: unknown): Promise<VariantEntity>;
    updateVariant(id: string, data: UpdateVariantData, dbOrTx?: unknown): Promise<VariantEntity>;
    deleteVariant(id: string, dbOrTx?: unknown): Promise<void>;
}

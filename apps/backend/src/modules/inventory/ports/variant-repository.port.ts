/**
 * Port for variant persistence and lookup.
 */
export interface CreateVariantData {
    id: string;
    productId: string;
    name: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
}

export interface UpdateVariantData {
    name?: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
}

export interface IVariantRepository {
    findVariantsBySupplierConfig(supplierId: string, dbOrTx?: unknown): Promise<unknown[]>;
    findVariantsByProductId(productId: string, supplierId?: string, dbOrTx?: unknown): Promise<unknown[]>;
    createVariant(data: CreateVariantData, dbOrTx?: unknown): Promise<unknown>;
    updateVariant(id: string, data: UpdateVariantData, dbOrTx?: unknown): Promise<unknown>;
    deleteVariant(id: string, dbOrTx?: unknown): Promise<unknown>;
}

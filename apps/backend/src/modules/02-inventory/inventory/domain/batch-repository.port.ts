/**
 * Port for batch lookup operations.
 * Split from IProductRepository since batch data belongs to the stock domain.
 */

export interface ProductBatchEntity {
    id: string;
    productId: string;
    supplierId: string | null;
    variantId: string | null;
    buyPrice: number;
    sellPrice: number;
    initialStock: number;
    currentStock: number;
    supplier?: { id: string; name: string } | null;
    createdAt?: Date;
}

export interface IBatchRepository {
    getLastBatchByProduct(productId: string, dbOrTx?: any): Promise<ProductBatchEntity | null>;
    findById(batchId: string, dbOrTx?: any): Promise<ProductBatchEntity | null>;
}

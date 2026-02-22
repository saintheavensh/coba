/**
 * Port for product persistence. Keeps use cases independent of DB implementation.
 */
import type {
    ProductEntity,
    ProductBatchEntity,
    CreateProductData,
    UpdateProductData,
    InventoryStats,
    SearchResult
} from "./product.entity";

export interface IProductRepository {
    findAll(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown): Promise<ProductEntity[]>;
    findById(id: string, dbOrTx?: unknown): Promise<ProductEntity | null>;
    createProduct(data: CreateProductData, dbOrTx?: unknown): Promise<ProductEntity>;
    updateProduct(id: string, data: UpdateProductData, dbOrTx?: unknown): Promise<ProductEntity>;
    deleteProduct(id: string, dbOrTx?: unknown): Promise<void>;
    updateMinStockByCategory(categoryId: string, minStock: number, dbOrTx?: unknown): Promise<number>;
    countByCategory(categoryId: string, dbOrTx?: unknown): Promise<number>;
    getInventoryStats(dbOrTx?: unknown): Promise<InventoryStats>;
    searchProductFlattened(search?: string, dbOrTx?: unknown): Promise<SearchResult[]>;
    getLastBatchByProduct(productId: string, dbOrTx?: unknown): Promise<ProductBatchEntity | null>;
}

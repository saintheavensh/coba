/**
 * Port for product persistence. Keeps use cases independent of DB implementation.
 */
export interface CreateProductData {
    id: string;
    name: string;
    code: string | null;
    categoryId: string | null;
    image?: string | null;
    minStock?: number;
    stock: number;
    compatibility?: string[];
}

export interface UpdateProductData {
    name?: string;
    code?: string | null;
    categoryId?: string | null;
    image?: string | null;
    minStock?: number;
    compatibility?: string[];
}

export interface IProductRepository {
    findAll(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown): Promise<unknown[]>;
    findById(id: string, dbOrTx?: unknown): Promise<unknown | null>;
    createProduct(data: CreateProductData, dbOrTx?: unknown): Promise<unknown>;
    updateProduct(id: string, data: UpdateProductData, dbOrTx?: unknown): Promise<unknown>;
    deleteProduct(id: string, dbOrTx?: unknown): Promise<unknown>;
    updateMinStockByCategory(categoryId: string, minStock: number, dbOrTx?: unknown): Promise<number>;
    countByCategory(categoryId: string, dbOrTx?: unknown): Promise<number>;
    getInventoryStats(dbOrTx?: unknown): Promise<unknown>;
    searchProductFlattened(search?: string, dbOrTx?: unknown): Promise<unknown[]>;
}

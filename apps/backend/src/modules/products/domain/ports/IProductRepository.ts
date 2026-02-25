import { Result } from "../../../../shared/core/Result";
import { Product } from "../entities/Product.entity";
import { Sku } from "../value-objects/Sku.vo";
import { PaginationParams, PaginatedResult } from "../../../../shared/application/pagination/Pagination";

/**
 * IProductRepository
 * Port for product persistence operations.
 */
export interface IProductRepository {
    /**
     * Finds a product by its unique identifier.
     */
    findById(id: string): Promise<Result<Product>>;

    /**
     * Finds a product by its SKU.
     */
    findBySku(sku: Sku): Promise<Result<Product>>;

    /**
     * Saves or updates a product.
     */
    save(product: Product): Promise<Result<void>>;

    /**
     * Deletes a product by its ID.
     */
    delete(id: string): Promise<Result<boolean>>;

    /**
     * Returns all active products.
     */
    findActive(): Promise<Result<Product[]>>;

    // Paginated methods
    findAllPaginated(params: PaginationParams): Promise<Result<PaginatedResult<Product>>>;
    findByCategoryPaginated(categoryId: string, params: PaginationParams): Promise<Result<PaginatedResult<Product>>>;
    searchProducts(query: string, params: PaginationParams): Promise<Result<PaginatedResult<Product>>>;
}

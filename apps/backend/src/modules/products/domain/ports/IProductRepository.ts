import { Result } from "../../../../shared/core/Result";
import { Product } from "../entities/Product.entity";
import { Sku } from "../value-objects/Sku.vo";
import { PaginationParams, PaginatedResult } from "../../../../shared/application/pagination/Pagination";
import { DBContext } from "../../../../shared/types/db-context";

/**
 * IProductRepository
 * Port for product persistence operations.
 */
export interface IProductRepository {
    /**
     * Finds a product by its unique identifier.
     */
    findById(id: string, dbOrTx?: DBContext): Promise<Result<Product>>;

    /**
     * Finds a product by its SKU.
     */
    findBySku(sku: Sku, dbOrTx?: DBContext): Promise<Result<Product>>;

    /**
     * Saves or updates a product.
     */
    save(product: Product, dbOrTx?: DBContext): Promise<Result<void>>;

    /**
     * Deletes a product by its ID.
     */
    delete(id: string, dbOrTx?: DBContext): Promise<Result<boolean>>;

    /**
     * Returns all active products.
     */
    findActive(dbOrTx?: DBContext): Promise<Result<Product[]>>;

    // Paginated methods
    findAllPaginated(params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>>;
    findByCategoryPaginated(categoryId: string, params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>>;
    searchProducts(query: string, params: PaginationParams, dbOrTx?: DBContext): Promise<Result<PaginatedResult<Product>>>;
}

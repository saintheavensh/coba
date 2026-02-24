import { Result } from "../../../../shared/core/Result";
import { Product } from "../entities/Product.entity";
import { Sku } from "../value-objects/Sku.vo";

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
}

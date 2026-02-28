import { Result } from "../../../../../shared/core/Result";

/**
 * IInventoryGateway
 * Port for interacting with the Inventory module.
 */
export interface IInventoryGateway {
    /**
     * Gets the current stock level for a product.
     */
    getStockLevel(productId: string): Promise<Result<number>>;

    /**
     * Checks if a product has any active transactions (purchases/sales/stock).
     */
    hasActiveTransactions(productId: string): Promise<Result<boolean>>;
}

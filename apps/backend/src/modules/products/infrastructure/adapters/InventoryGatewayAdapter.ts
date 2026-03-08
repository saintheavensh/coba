import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { IInventoryGateway } from "../../domain/ports/IInventoryGateway";
import { Result } from "../../../../shared/core/Result";
import { InventoryService } from "../../../inventory/services/inventory.service";
import { DBContext } from "../../../../shared/types/db-context";

/**
 * InventoryGatewayAdapter
 * Implements the Products module's port for interacting with the Inventory module.
 * This breaks direct dependencies between modules.
 */
@injectable()
export class InventoryGatewayAdapter implements IInventoryGateway {
    constructor(
        @inject(TYPES.InventoryFacade) private inventoryFacade: InventoryService
    ) { }

    /**
     * Retrieves the current stock level for a product from the Inventory module.
     */
    public async getStockLevel(productId: string, dbOrTx?: DBContext): Promise<Result<number>> {
        try {
            // Note: The signature of the Inventory module's facade might change
            // as it gets refactored to Clean Architecture.
            const stockResult = await (this.inventoryFacade as any).getStockForProduct(productId, dbOrTx);

            if (stockResult.isFailure) {
                return Result.fail(`Failed to get stock: ${stockResult.errorValue()}`);
            }

            return Result.ok(stockResult.getValue());
        } catch (error: any) {
            return Result.fail(`Inventory gateway error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Checks if a product has active inventory transactions.
     */
    public async hasActiveTransactions(productId: string, dbOrTx?: DBContext): Promise<Result<boolean>> {
        try {
            const result = await (this.inventoryFacade as any).hasActiveTransactions(productId, dbOrTx);

            if (result.isFailure) {
                return Result.fail(`Failed to check transactions: ${result.errorValue()}`);
            }

            return Result.ok(result.getValue());
        } catch (error: any) {
            return Result.fail(`Inventory gateway error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

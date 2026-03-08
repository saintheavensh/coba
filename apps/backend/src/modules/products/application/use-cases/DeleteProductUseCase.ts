import { inject, injectable } from "inversify";
import { UseCase } from "../../../../shared/core/UseCase";
import { Result } from "../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { IInventoryGateway } from "../../domain/ports/IInventoryGateway";
import { ProductValidationService } from "../../domain/services/ProductValidationService";

/**
 * DeleteProductUseCase
 * Orchestrates the deletion of a product, ensuring business rules are met.
 */
@injectable()
export class DeleteProductUseCase implements UseCase<string, Result<void>> {
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.IInventoryGateway) private readonly inventoryGateway: IInventoryGateway,
    ) {
    }

    public async execute(productId: string, _context?: { requestId?: string; userId?: string }): Promise<Result<void>> {
        // 1. Find product
        const productResult = await this.productRepo.findById(productId);
        if (productResult.isFailure) {
            return Result.fail(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 2. Domain check: Can internal state be deleted?
        if (!product.canBeDeleted()) {
            return Result.fail("Active or archived products cannot be deleted. Deactivate or DRAFT them first.");
        }

        // 3. Cross-module check: Are there inventory references?
        const validationService = new ProductValidationService(this.inventoryGateway);
        const referenceCheck = await validationService.checkProductReferences(productId);

        if (referenceCheck.isFailure) {
            return Result.fail(referenceCheck.errorValue());
        }

        if (!referenceCheck.getValue().canBeDeleted) {
            return Result.fail("Cannot delete product: Active inventory records or sales transactions exist.");
        }

        // 4. Delete
        const deleteResult = await this.productRepo.delete(productId);
        if (deleteResult.isFailure) {
            return Result.fail(deleteResult.errorValue());
        }

        return Result.ok();
    }
}

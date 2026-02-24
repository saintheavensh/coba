import { inject, injectable } from "inversify";
import { UseCase } from "../../../../shared/core/UseCase";
import { Result } from "../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";

/**
 * ActivateProductUseCase
 * Orchestrates the activation of a product.
 */
@injectable()
export class ActivateProductUseCase implements UseCase<string, Result<ProductDTO>> {
    constructor(
        @inject(TYPES.IProductRepository)
        private readonly productRepo: IProductRepository
    ) { }

    public async execute(productId: string): Promise<Result<ProductDTO>> {
        // 1. Find product
        const productResult = await this.productRepo.findById(productId);
        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 2. Activate (Domain will handle state transition rules)
        const activationResult = product.activate();
        if (activationResult.isFailure) {
            return Result.fail<ProductDTO>(activationResult.errorValue());
        }

        // 3. Save
        const saveResult = await this.productRepo.save(product);
        if (saveResult.isFailure) {
            return Result.fail<ProductDTO>(saveResult.errorValue());
        }

        return Result.ok(ProductMapper.toDTO(product));
    }
}

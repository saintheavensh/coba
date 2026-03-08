import { inject, injectable } from "inversify";
import { UseCase } from "../../../../shared/core/UseCase";
import { Result } from "../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Product } from "../../domain/entities/Product.entity";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";
import { Sku } from "../../domain/value-objects/Sku.vo";

interface GetProductRequest {
    id?: string;
    sku?: string;
}

/**
 * GetProductUseCase
 * Orchestrates product retrieval by ID or SKU.
 */
@injectable()
export class GetProductUseCase implements UseCase<GetProductRequest, Result<ProductDTO>> {
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
    ) {
    }

    public async execute(request: GetProductRequest, _context?: { requestId?: string; userId?: string }): Promise<Result<ProductDTO>> {
        let productResult: Result<Product> = Result.fail("Product identifier missing");

        if (request.id) {
            productResult = await this.productRepo.findById(request.id);
        } else if (request.sku) {
            const skuRes = Sku.create(request.sku);
            if (skuRes.isFailure) return Result.fail(skuRes.errorValue());
            productResult = await this.productRepo.findBySku(skuRes.getValue());
        } else {
            return Result.fail("Either product ID or SKU must be provided");
        }

        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        return Result.ok(ProductMapper.toDTO(productResult.getValue()));
    }
}

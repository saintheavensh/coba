import { inject, injectable } from "inversify";
import { UseCase } from "../../../../shared/core/UseCase";
import { Result } from "../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { ProductDTO } from "../dtos/ProductDTO";
import { Product } from "../../domain/entities/Product.entity";
import { Price } from "../../domain/value-objects/Price.vo";
import { Sku } from "../../domain/value-objects/Sku.vo";

import { ProductMapper } from "../mappers/ProductMapper";

/**
 * CreateProductUseCase
 * Orchestrates the creation of a new product.
 */
@injectable()
export class CreateProductUseCase implements UseCase<CreateProductDTO, Result<ProductDTO>> {
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
    ) {
    }

    public async execute(request: CreateProductDTO, _context?: { requestId?: string; userId?: string }): Promise<Result<ProductDTO>> {
        // 1. Create Value Objects
        const skuResult = Sku.create(request.sku);
        const priceResult = Price.create(request.price);

        const result = Result.combine([skuResult, priceResult]);
        if (result.isFailure) {
            return Result.fail<ProductDTO>(result.errorValue());
        }

        // 2. Create Domain Entity
        const productResult = Product.create({
            sku: skuResult.getValue(),
            name: request.name,
            price: priceResult.getValue(),
            categoryId: request.categoryId
        });

        if (productResult.isFailure) {
            return Result.fail<ProductDTO>(productResult.errorValue());
        }

        const product = productResult.getValue();

        // 3. Save to Repository
        const saveResult = await this.productRepo.save(product);
        if (saveResult.isFailure) {
            return Result.fail<ProductDTO>(saveResult.errorValue());
        }

        // 4. Return DTO
        return Result.ok(ProductMapper.toDTO(product));
    }
}

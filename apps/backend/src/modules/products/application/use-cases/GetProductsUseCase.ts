import { inject, injectable } from "inversify";
import { UseCase } from "../../../../shared/core/UseCase";
import { Result } from "../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { ProductMapper } from "../mappers/ProductMapper";

import { ProductDTO } from "../dtos/ProductDTO";
import { PaginatedResult } from "../../../../shared/application/pagination/Pagination";

export interface GetProductsRequest {
    search?: string | undefined;
    categoryId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}

@injectable()
export class GetProductsUseCase implements UseCase<GetProductsRequest, Result<PaginatedResult<ProductDTO>>> {
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository
    ) { }

    public async execute(request: GetProductsRequest): Promise<Result<PaginatedResult<ProductDTO>>> {
        const page = request.page || 1;
        const limit = request.limit || 50;

        let result;
        if (request.search) {
            result = await this.productRepo.searchProducts(request.search, { page, limit });
        } else if (request.categoryId) {
            result = await this.productRepo.findByCategoryPaginated(request.categoryId, { page, limit });
        } else {
            result = await this.productRepo.findAllPaginated({ page, limit });
        }

        if (result.isFailure) {
            return Result.fail(result.errorValue());
        }

        const paginatedData = result.getValue();
        return Result.ok({
            ...paginatedData,
            data: paginatedData.data.map(p => ProductMapper.toDTO(p))
        });
    }
}

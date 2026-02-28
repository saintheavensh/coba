import { inject, injectable } from "inversify";
import { UseCase } from "../../../../../shared/core/UseCase";
import { Result } from "../../../../../shared/core/Result";
import { TYPES } from "../../types";
import type { IProductRepository } from "../../domain/ports/IProductRepository";
import { Logger, LoggerFactory } from "../../../../../shared/utils/logger/Logger";
import { ProductDTO } from "../dtos/ProductDTO";
import { ProductMapper } from "../mappers/ProductMapper";

interface GetProductsRequest {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
}

@injectable()
export class GetProductsUseCase implements UseCase<GetProductsRequest, Result<any>> {
    private logger: Logger;
    constructor(
        @inject(TYPES.IProductRepository) private readonly productRepo: IProductRepository,
        @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.createLogger('GetProductsUseCase');
    }

    public async execute(request: GetProductsRequest): Promise<Result<any>> {
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
            data: paginatedData.data.map(p => ProductMapper.toDTO(p)),
            meta: paginatedData.meta
        });
    }
}

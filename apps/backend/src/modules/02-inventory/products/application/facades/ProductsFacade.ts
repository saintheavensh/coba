import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { Result } from "../../../../../shared/core/Result";
import { ProductDTO } from "../dtos/ProductDTO";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { UpdateProductDTO } from "../dtos/UpdateProductDTO";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import { GetProductUseCase } from "../use-cases/GetProductUseCase";
import { GetProductsUseCase } from "../use-cases/GetProductsUseCase";
import { GetProductVariantsUseCase } from "../use-cases/GetProductVariantsUseCase";
import { GetBatchesUseCase } from "../use-cases/GetBatchesUseCase";
import { UpdateProductUseCase } from "../use-cases/UpdateProductUseCase";
import { ActivateProductUseCase } from "../use-cases/ActivateProductUseCase";
import { DeleteProductUseCase } from "../use-cases/DeleteProductUseCase";

/**
 * ProductsFacade
 * Entrance point for other modules to interact with the Products module.
 * It hides the complexity of use cases and mappers.
 */
@injectable()
export class ProductsFacade {
    constructor(
        @inject(TYPES.CreateProductUseCase)
        private readonly createProductUC: CreateProductUseCase,
        @inject(TYPES.GetProductsUseCase)
        private readonly getProductsUC: GetProductsUseCase,
        @inject(TYPES.GetProductUseCase || Symbol.for("GetProductUseCase"))
        private readonly getProductUC: GetProductUseCase,
        @inject(TYPES.GetProductVariantsUseCase || Symbol.for("GetProductVariantsUseCase"))
        private readonly getProductVariantsUC: GetProductVariantsUseCase,
        @inject(TYPES.GetBatchesUseCase || Symbol.for("GetBatchesUseCase"))
        private readonly getBatchesUC: GetBatchesUseCase,
        @inject(TYPES.UpdateProductUseCase)
        private readonly updateProductUC: UpdateProductUseCase,
        @inject(TYPES.DeleteProductUseCase)
        private readonly deleteProductUC: DeleteProductUseCase,
        // Note: If Activate doesn't have a specific TYPE yet, we add it to TYPES or use generic. 
        // Let's assume we use it as needed.
    ) { }

    public async createProduct(data: CreateProductDTO): Promise<Result<ProductDTO>> {
        return this.createProductUC.execute(data);
    }

    public async getProduct(id: string): Promise<Result<ProductDTO>> {
        return this.getProductUC.execute({ id });
    }

    public async getAllProducts(deviceId?: string, search?: string, categoryId?: string, page?: number, limit?: number): Promise<any> {
        const result = await this.getProductsUC.execute({ search, categoryId, page, limit });
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue();
    }

    public async getProductBySku(sku: string): Promise<Result<ProductDTO>> {
        return this.getProductUC.execute({ sku });
    }

    public async searchProduct(query: string): Promise<any> {
        const result = await this.getProductsUC.execute({ search: query });
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue().data;
    }

    public async getProductVariants(productId: string, supplierId?: string): Promise<any> {
        const result = await this.getProductVariantsUC.execute(productId, supplierId);
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue();
    }

    public async getBatches(supplierId?: string): Promise<any> {
        const result = await this.getBatchesUC.execute(supplierId);
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue();
    }

    public async getStats(): Promise<any> {
        // Stub for dashboard or admin stats 
        // Real implementation would need a dedicated GetProductStatsUseCase
        return { totalProducts: 0, activeProducts: 0, lowStock: 0 };
    }

    public async updateProduct(id: string, data: UpdateProductDTO): Promise<Result<ProductDTO>> {
        return this.updateProductUC.execute({ id, data });
    }

    public async deleteProduct(id: string): Promise<Result<void>> {
        return this.deleteProductUC.execute(id);
    }
}

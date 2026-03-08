import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { Result } from "../../../../shared/core/Result";
import { ProductDTO } from "../dtos/ProductDTO";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { UpdateProductDTO } from "../dtos/UpdateProductDTO";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import { GetProductUseCase } from "../use-cases/GetProductUseCase";
import { GetProductsUseCase } from "../use-cases/GetProductsUseCase";
import { UpdateProductUseCase } from "../use-cases/UpdateProductUseCase";
import { PaginatedResult } from "../../../../shared/application/pagination/Pagination";
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

    public async getAllProducts(search?: string, categoryId?: string, page?: number, limit?: number): Promise<PaginatedResult<ProductDTO>> {
        const result = await this.getProductsUC.execute({ search, categoryId, page, limit });
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue();
    }

    public async getProductBySku(sku: string): Promise<Result<ProductDTO>> {
        return this.getProductUC.execute({ sku });
    }

    public async searchProduct(query: string): Promise<ProductDTO[]> {
        const result = await this.getProductsUC.execute({ search: query });
        if (result.isFailure) throw new Error(result.errorValue() as string);
        return result.getValue().data;
    }

    public async getStats(): Promise<{ totalProducts: number; activeProducts: number; lowStock: number }> {
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

    public async getProductCountByCategory(_categoryId: string): Promise<number> {
        // Implementation stub
        return 0;
    }

    public async getSupplierVariants(_supplierId: string): Promise<unknown[]> {
        // Implementation stub
        return [];
    }

    public async getProductVariants(_productId: string, _supplierId?: string): Promise<unknown[]> {
        // Implementation stub
        return [];
    }

    public async createVariant(_data: unknown): Promise<Record<string, unknown>> {
        // Implementation stub
        return {};
    }

    async updateVariant(_id: string, _data: unknown): Promise<Record<string, unknown>> {
        // Implementation stub
        return {};
    }

    public async deleteVariant(_id: string): Promise<void> {
        // Implementation stub
    }

    public async bulkUpdateMinStock(_data: unknown): Promise<void> {
        // Implementation stub
    }

    public async printLabel(_data: unknown): Promise<Record<string, unknown>> {
        // Implementation stub
        return { success: true };
    }
}

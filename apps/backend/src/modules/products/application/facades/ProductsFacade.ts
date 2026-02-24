import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { Result } from "../../../../shared/core/Result";
import { ProductDTO } from "../dtos/ProductDTO";
import { CreateProductDTO } from "../dtos/CreateProductDTO";
import { UpdateProductDTO } from "../dtos/UpdateProductDTO";
import { CreateProductUseCase } from "../use-cases/CreateProductUseCase";
import { GetProductUseCase } from "../use-cases/GetProductUseCase";
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
        @inject(TYPES.GetProductsUseCase) // Note: Map to correct symbol
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

    public async getProductBySku(sku: string): Promise<Result<ProductDTO>> {
        return this.getProductUC.execute({ sku });
    }

    public async updateProduct(id: string, data: UpdateProductDTO): Promise<Result<ProductDTO>> {
        return this.updateProductUC.execute({ id, data });
    }

    public async deleteProduct(id: string): Promise<Result<void>> {
        return this.deleteProductUC.execute(id);
    }
}

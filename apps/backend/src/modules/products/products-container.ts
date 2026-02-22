/**
 * Products module composition root.
 * Wires infrastructure adapters → use cases and exposes a service facade.
 * No other module should instantiate adapters directly.
 */
import {
    ProductRepositoryAdapter,
    VariantRepositoryAdapter,
    CategoryRepositoryAdapter,
    RegisterGateAdapter,
    PrintGatewayAdapter
} from "./infrastructure";
import {
    GetProductsUseCase,
    GetProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetProductVariantsUseCase,
    CreateVariantUseCase,
    UpdateVariantUseCase,
    DeleteVariantUseCase,
    GetSupplierVariantsUseCase,
    BulkUpdateMinStockUseCase,
    GetProductCountByCategoryUseCase,
    GetInventoryStatsUseCase,
    SearchProductUseCase,
    PrintLabelUseCase
} from "./application";

import type { ProductEntity, VariantEntity, InventoryStats, SearchResult, LabelData } from "./domain";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type CreateProductDto = z.infer<typeof productSchema>;

// Infrastructure adapters (singletons within the module)
const productRepository = new ProductRepositoryAdapter();
const variantRepository = new VariantRepositoryAdapter();
const categoryRepository = new CategoryRepositoryAdapter();
const registerGate = new RegisterGateAdapter();
const printGateway = new PrintGatewayAdapter();

// Use cases
const getProductsUC = new GetProductsUseCase(productRepository);
const getProductByIdUC = new GetProductByIdUseCase(productRepository);
const createProductUC = new CreateProductUseCase(productRepository, variantRepository, categoryRepository, registerGate);
const updateProductUC = new UpdateProductUseCase(productRepository, registerGate);
const deleteProductUC = new DeleteProductUseCase(productRepository);
const getProductVariantsUC = new GetProductVariantsUseCase(variantRepository);
const createVariantUC = new CreateVariantUseCase(variantRepository, registerGate);
const updateVariantUC = new UpdateVariantUseCase(variantRepository, registerGate);
const deleteVariantUC = new DeleteVariantUseCase(variantRepository);
const getSupplierVariantsUC = new GetSupplierVariantsUseCase(variantRepository);
const bulkUpdateMinStockUC = new BulkUpdateMinStockUseCase(productRepository, registerGate);
const getProductCountByCategoryUC = new GetProductCountByCategoryUseCase(productRepository);
const getInventoryStatsUC = new GetInventoryStatsUseCase(productRepository);
const searchProductUC = new SearchProductUseCase(productRepository);
const printLabelUC = new PrintLabelUseCase(printGateway);

/**
 * ProductsService — facade that external modules use.
 * Method signatures match the old InventoryApplicationService for product-related methods.
 */
export class ProductsService {
    async getAllProducts(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown): Promise<ProductEntity[]> {
        return getProductsUC.execute(deviceId, search, categoryId, dbOrTx);
    }

    async getProductById(id: string, dbOrTx?: unknown): Promise<ProductEntity | null> {
        return getProductByIdUC.execute(id, dbOrTx);
    }

    async createProduct(data: CreateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        return createProductUC.execute(data, user, dbOrTx);
    }

    async updateProduct(id: string, data: CreateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        return updateProductUC.execute(id, data, user, dbOrTx);
    }

    async deleteProduct(id: string, dbOrTx?: unknown): Promise<void> {
        return deleteProductUC.execute(id, dbOrTx);
    }

    async getSupplierVariants(supplierId: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return getSupplierVariantsUC.execute(supplierId, dbOrTx);
    }

    async createVariant(
        data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number },
        user?: unknown,
        dbOrTx?: unknown
    ): Promise<VariantEntity> {
        return createVariantUC.execute(data, user, dbOrTx);
    }

    async updateVariant(
        id: string,
        data: Partial<{ name: string; image?: string; sku?: string; defaultPrice?: number }>,
        user?: unknown,
        dbOrTx?: unknown
    ): Promise<VariantEntity> {
        return updateVariantUC.execute(id, data, user, dbOrTx);
    }

    async getProductVariants(productId: string, supplierId?: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return getProductVariantsUC.execute(productId, supplierId, dbOrTx);
    }

    async deleteVariant(id: string, dbOrTx?: unknown): Promise<void> {
        return deleteVariantUC.execute(id, dbOrTx);
    }

    async bulkUpdateMinStock(categoryId: string, minStock: number, user?: unknown, dbOrTx?: unknown): Promise<number> {
        return bulkUpdateMinStockUC.execute(categoryId, minStock, user, dbOrTx);
    }

    async getProductCountByCategory(categoryId: string, dbOrTx?: unknown): Promise<number> {
        return getProductCountByCategoryUC.execute(categoryId, dbOrTx);
    }

    async getStats(dbOrTx?: unknown): Promise<InventoryStats> {
        return getInventoryStatsUC.execute(dbOrTx);
    }

    async searchProduct(search?: string, dbOrTx?: unknown): Promise<SearchResult[]> {
        return searchProductUC.execute(search, dbOrTx);
    }

    async printLabel(data: LabelData): Promise<{ success: boolean; error?: unknown }> {
        return printLabelUC.execute(data);
    }
}

/** Singleton service instance */
export const productsService = new ProductsService();

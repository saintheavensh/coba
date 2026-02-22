/**
 * Application service: orchestrates inventory operations using ports only.
 * No direct dependency on Drizzle, schema, or sibling modules.
 */
import { productSchema } from "@repo/shared";
import { z } from "zod";
import type { IProductRepository } from "../domain/product-repository.port";
import type { IVariantRepository } from "../domain/variant-repository.port";
import type { IStockMutationGateway } from "../domain/stock-mutation-gateway.port";
import type { IRegisterGate } from "../domain/register-gate.port";
import type { ICategoryRepository } from "../domain/category-repository.port";
import type { IPrintGateway } from "../domain/print-gateway.port";
import type {
    ProductEntity,
    ProductBatchEntity,
    VariantEntity,
    InventoryStats,
    SearchResult,
    LabelData
} from "../domain/product.entity";
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    ReverseStockInput
} from "../domain/stock.types";

type CreateProductDto = z.infer<typeof productSchema>;

export interface InventoryApplicationServiceDeps {
    productRepository: IProductRepository;
    variantRepository: IVariantRepository;
    stockGateway: IStockMutationGateway;
    registerGate: IRegisterGate;
    categoryRepository: ICategoryRepository;
    printGateway: IPrintGateway;
}

export class InventoryApplicationService {
    constructor(private readonly deps: InventoryApplicationServiceDeps) { }

    private async ensureRegisterOpenForMutation(user: unknown, dbOrTx?: unknown): Promise<void> {
        const u = user as { roles?: string[] } | undefined;
        if (!u?.roles) return;
        const roles = u.roles;
        const isRestricted =
            roles.includes("kasir") &&
            !roles.includes("owner") &&
            !roles.includes("manager") &&
            !roles.includes("super_admin");
        if (isRestricted) {
            const isOpen = await this.deps.registerGate.isRegisterOpen(dbOrTx);
            if (!isOpen) throw new Error("Register Closed. Inventory changes restricted for Kasir.");
        }
    }

    async getAllProducts(deviceId?: string, search?: string, categoryId?: string, dbOrTx?: unknown): Promise<ProductEntity[]> {
        return this.deps.productRepository.findAll(deviceId, search, categoryId, dbOrTx);
    }

    async getProductById(id: string, dbOrTx?: unknown): Promise<ProductEntity | null> {
        return this.deps.productRepository.findById(id, dbOrTx);
    }

    async createProduct(data: CreateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);

        const id = "PRD-" + Date.now().toString().slice(-6);
        const product = await this.deps.productRepository.createProduct(
            {
                id,
                name: data.name,
                code: data.code && data.code.trim() !== "" ? data.code : null,
                categoryId: data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null,
                image: data.image,
                minStock: data.minStock,
                stock: 0,
                compatibility: data.compatibility
            },
            dbOrTx
        );

        if (data.categoryId) {
            const category = await this.deps.categoryRepository.findById(data.categoryId, dbOrTx);
            if (category?.variantTemplates?.length) {
                let i = 0;
                for (const template of category.variantTemplates) {
                    await this.deps.variantRepository.createVariant(
                        {
                            id: "VAR-" + Date.now().toString().slice(-6) + "-" + (i++),
                            productId: product.id,
                            name: template.name
                        },
                        dbOrTx
                    );
                }
            }
        }
        return product;
    }

    async updateProduct(id: string, data: CreateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.deps.productRepository.updateProduct(
            id,
            {
                name: data.name,
                code: data.code,
                categoryId: data.categoryId,
                image: data.image,
                minStock: data.minStock,
                compatibility: data.compatibility
            },
            dbOrTx
        );
    }

    async deleteProduct(id: string, dbOrTx?: unknown): Promise<void> {
        return this.deps.productRepository.deleteProduct(id, dbOrTx);
    }

    async getSupplierVariants(supplierId: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return this.deps.variantRepository.findVariantsBySupplierConfig(supplierId, dbOrTx);
    }

    async createVariant(
        data: { productId: string; name: string; image?: string; sku?: string; defaultPrice?: number },
        user?: unknown,
        dbOrTx?: unknown
    ): Promise<VariantEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        const id = "VAR-" + Date.now().toString().slice(-6);
        return this.deps.variantRepository.createVariant(
            {
                id,
                productId: data.productId,
                name: data.name,
                image: data.image,
                sku: data.sku,
                defaultPrice: data.defaultPrice
            },
            dbOrTx
        );
    }

    async updateVariant(
        id: string,
        data: Partial<{ name: string; image?: string; sku?: string; defaultPrice?: number }>,
        user?: unknown,
        dbOrTx?: unknown
    ): Promise<VariantEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.deps.variantRepository.updateVariant(id, data, dbOrTx);
    }

    async getProductVariants(productId: string, supplierId?: string, dbOrTx?: unknown): Promise<VariantEntity[]> {
        return this.deps.variantRepository.findVariantsByProductId(productId, supplierId, dbOrTx);
    }

    async deleteVariant(id: string, dbOrTx?: unknown): Promise<void> {
        return this.deps.variantRepository.deleteVariant(id, dbOrTx);
    }

    async bulkUpdateMinStock(categoryId: string, minStock: number, user?: unknown, dbOrTx?: unknown): Promise<number> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.deps.productRepository.updateMinStockByCategory(categoryId, minStock, dbOrTx);
    }

    async getProductCountByCategory(categoryId: string, dbOrTx?: unknown): Promise<number> {
        return this.deps.productRepository.countByCategory(categoryId, dbOrTx);
    }

    async getStats(dbOrTx?: unknown): Promise<InventoryStats> {
        return this.deps.productRepository.getInventoryStats(dbOrTx);
    }

    async searchProduct(search?: string, dbOrTx?: unknown): Promise<SearchResult[]> {
        return this.deps.productRepository.searchProductFlattened(search, dbOrTx);
    }

    async deductStockFIFO(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput> {
        return this.deps.stockGateway.deductStockFIFO(input, dbOrTx);
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        return this.deps.stockGateway.addStockFromPurchaseVerification(input, dbOrTx);
    }

    async printLabel(data: LabelData): Promise<{ success: boolean; error?: unknown }> {
        return this.deps.printGateway.printProductLabel(data);
    }

    async reverseStockFromPurchaseDeletion(input: ReverseStockInput, dbOrTx: unknown): Promise<void> {
        return this.deps.stockGateway.reverseStockFromPurchaseDeletion(input, dbOrTx);
    }

    async getLastBatchByProduct(productId: string, dbOrTx?: unknown): Promise<ProductBatchEntity | null> {
        return this.deps.productRepository.getLastBatchByProduct(productId, dbOrTx);
    }
}

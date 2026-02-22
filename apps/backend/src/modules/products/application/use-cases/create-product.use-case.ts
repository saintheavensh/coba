/**
 * Use case: Create a new product with optional variant templates from category.
 * Checks the register gate for kasir role restriction before mutation.
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { IVariantRepository } from "../../domain/variant-repository.port";
import type { ICategoryRepository } from "../../domain/category-repository.port";
import type { IRegisterGate } from "../../domain/register-gate.port";
import type { ProductEntity } from "../../domain/product.entity";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type CreateProductDto = z.infer<typeof productSchema>;

export class CreateProductUseCase {
    constructor(
        private readonly productRepository: IProductRepository,
        private readonly variantRepository: IVariantRepository,
        private readonly categoryRepository: ICategoryRepository,
        private readonly registerGate: IRegisterGate
    ) { }

    async execute(data: CreateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);

        const id = "PRD-" + Date.now().toString().slice(-6);
        const product = await this.productRepository.createProduct(
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

        // Auto-create variant templates from category if available
        if (data.categoryId) {
            const category = await this.categoryRepository.findById(data.categoryId, dbOrTx);
            if (category?.variantTemplates?.length) {
                let i = 0;
                for (const template of category.variantTemplates) {
                    await this.variantRepository.createVariant(
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

    /** Kasir role cannot mutate inventory when register is closed. */
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
            const isOpen = await this.registerGate.isRegisterOpen(dbOrTx);
            if (!isOpen) throw new Error("Register Closed. Inventory changes restricted for Kasir.");
        }
    }
}

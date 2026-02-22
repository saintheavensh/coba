/**
 * Use case: Update an existing product.
 * Checks the register gate for kasir role restriction before mutation.
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { IRegisterGate } from "../../domain/register-gate.port";
import type { ProductEntity } from "../../domain/product.entity";
import { productSchema } from "@repo/shared";
import { z } from "zod";

type UpdateProductDto = z.infer<typeof productSchema>;

export class UpdateProductUseCase {
    constructor(
        private readonly productRepository: IProductRepository,
        private readonly registerGate: IRegisterGate
    ) { }

    async execute(id: string, data: UpdateProductDto, user?: unknown, dbOrTx?: unknown): Promise<ProductEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.productRepository.updateProduct(
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

/**
 * Use case: Create a variant for a product.
 * Checks the register gate for kasir role restriction before mutation.
 */
import type { IVariantRepository } from "../../domain/variant-repository.port";
import type { IRegisterGate } from "../../domain/register-gate.port";
import type { VariantEntity } from "../../domain/product.entity";

interface CreateVariantInput {
    productId: string;
    name: string;
    image?: string;
    sku?: string;
    defaultPrice?: number;
}

export class CreateVariantUseCase {
    constructor(
        private readonly variantRepository: IVariantRepository,
        private readonly registerGate: IRegisterGate
    ) { }

    async execute(data: CreateVariantInput, user?: unknown, dbOrTx?: unknown): Promise<VariantEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        const id = "VAR-" + Date.now().toString().slice(-6);
        return this.variantRepository.createVariant(
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

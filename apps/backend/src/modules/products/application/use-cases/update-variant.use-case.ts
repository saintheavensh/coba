/**
 * Use case: Update an existing variant.
 * Checks the register gate for kasir role restriction before mutation.
 */
import type { IVariantRepository } from "../../domain/variant-repository.port";
import type { IRegisterGate } from "../../domain/register-gate.port";
import type { VariantEntity } from "../../domain/product.entity";

interface UpdateVariantInput {
    name?: string;
    image?: string;
    sku?: string;
    defaultPrice?: number;
}

export class UpdateVariantUseCase {
    constructor(
        private readonly variantRepository: IVariantRepository,
        private readonly registerGate: IRegisterGate
    ) { }

    async execute(id: string, data: UpdateVariantInput, user?: unknown, dbOrTx?: unknown): Promise<VariantEntity> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.variantRepository.updateVariant(id, data, dbOrTx);
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

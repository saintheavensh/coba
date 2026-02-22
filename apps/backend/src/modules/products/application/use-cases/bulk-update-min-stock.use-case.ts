/**
 * Use case: Bulk update minimum stock for all products in a category.
 * Checks the register gate for kasir role restriction before mutation.
 */
import type { IProductRepository } from "../../domain/product-repository.port";
import type { IRegisterGate } from "../../domain/register-gate.port";

export class BulkUpdateMinStockUseCase {
    constructor(
        private readonly productRepository: IProductRepository,
        private readonly registerGate: IRegisterGate
    ) { }

    async execute(categoryId: string, minStock: number, user?: unknown, dbOrTx?: unknown): Promise<number> {
        await this.ensureRegisterOpenForMutation(user, dbOrTx);
        return this.productRepository.updateMinStockByCategory(categoryId, minStock, dbOrTx);
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

import type { IVariantRepository, CreateVariantData, UpdateVariantData } from "../ports/variant-repository.port";
import { InventoryModel } from "../models/inventory.model";

export class VariantRepositoryAdapter implements IVariantRepository {
    private model = new InventoryModel();

    async findVariantsBySupplierConfig(supplierId: string, dbOrTx?: unknown) {
        return this.model.findVariantsBySupplierConfig(supplierId, dbOrTx);
    }

    async findVariantsByProductId(productId: string, supplierId?: string, dbOrTx?: unknown) {
        return this.model.findVariantsByProductId(productId, supplierId, dbOrTx);
    }

    async createVariant(data: CreateVariantData, dbOrTx?: unknown) {
        return this.model.createVariant(data as any, dbOrTx);
    }

    async updateVariant(id: string, data: UpdateVariantData, dbOrTx?: unknown) {
        return this.model.updateVariant(id, data as any, dbOrTx);
    }

    async deleteVariant(id: string, dbOrTx?: unknown) {
        return this.model.deleteVariant(id, dbOrTx);
    }
}

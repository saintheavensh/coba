import { DBContext } from "../../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";

export class AddVariantTemplateUseCase {
    constructor(private repository: ICategoryRepository) { }

    async execute(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext) {
        // 1. Add to Category with supplier
        const template = await this.repository.addVariantTemplate(categoryId, name, supplierId, dbOrTx);

        // 2. Propagate to ALL existing products in this category
        await this.repository.propagateVariantToProducts(categoryId, name, supplierId, dbOrTx);

        return template;
    }
}

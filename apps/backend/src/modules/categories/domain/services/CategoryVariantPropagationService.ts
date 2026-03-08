import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../repositories/category.repository";
import { TYPES } from "../../types";

@injectable()
export class CategoryVariantPropagationService {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository
    ) { }

    async propagate(categoryId: string, variantName: string, dbOrTx?: DBContext): Promise<void> {
        const products = await this.repository.findProductsByCategory(categoryId, dbOrTx);

        for (const product of products) {
            const hasVariant = await this.repository.productHasVariant(product.id, variantName, dbOrTx);
            if (!hasVariant) {
                await this.repository.addVariantToProduct(product.id, variantName, dbOrTx);
            }
        }
    }
}

import { inject, injectable } from "inversify";
import { DBContext } from "../../../../shared/types/db-context";
import { ICategoryRepository } from "../../domain";
import { CategoryVariantPropagationService } from "../../domain/services/CategoryVariantPropagationService";
import { TYPES } from "../../types";

@injectable()
export class AddVariantTemplateUseCase {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly repository: ICategoryRepository,
        @inject(TYPES.CategoryVariantPropagationService) private readonly propagationService: CategoryVariantPropagationService
    ) { }

    async execute(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext) {
        // 1. Add to Category with supplier
        const template = await this.repository.addVariantTemplate(categoryId, name, supplierId, dbOrTx);

        // 2. Propagate to ALL existing products in this category
        await this.propagationService.propagate(categoryId, name, dbOrTx);

        return template;
    }
}

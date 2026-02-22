/**
 * Adapter for category lookup. Implements ICategoryRepository from domain.
 */
import type { ICategoryRepository } from "../domain/category-repository.port";
import type { CategoryWithTemplates } from "../domain/product.entity";
import { CategoriesModel } from "../../categories/models/categories.model";

export class CategoryRepositoryAdapter implements ICategoryRepository {
    private model = new CategoriesModel();

    async findById(id: string, dbOrTx?: unknown): Promise<CategoryWithTemplates | null> {
        const category = await this.model.findById(id, dbOrTx);
        if (!category) return null;
        return {
            id: category.id,
            variantTemplates: (category as any).variantTemplates
        };
    }
}

import type { ICategoryRepository, CategoryWithTemplates } from "../ports/category-repository.port";
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

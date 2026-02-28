import { CategoryRepositoryAdapter } from "./infrastructure";
import {
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    AddVariantTemplateUseCase,
    RemoveVariantTemplateUseCase
} from "./application";

// Adapters
const categoryRepository = new CategoryRepositoryAdapter();

// Use Cases
const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);
const addVariantTemplateUseCase = new AddVariantTemplateUseCase(categoryRepository);
const removeVariantTemplateUseCase = new RemoveVariantTemplateUseCase(categoryRepository);

/**
 * CategoriesFacade — Single entry point for the Categories module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class CategoriesFacade {
    async getAll() {
        return await getCategoriesUseCase.execute();
    }

    async create(data: any) {
        return await createCategoryUseCase.execute(data);
    }

    async update(id: string, data: any) {
        return await updateCategoryUseCase.execute(id, data);
    }

    async delete(id: string) {
        return await deleteCategoryUseCase.execute(id);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string) {
        return await addVariantTemplateUseCase.execute(categoryId, name, supplierId);
    }

    async removeVariantTemplate(id: string) {
        return await removeVariantTemplateUseCase.execute(id);
    }

    async findById(id: string) {
        return await categoryRepository.findById(id);
    }
}

/** Singleton instance */
export const categoriesFacade = new CategoriesFacade();

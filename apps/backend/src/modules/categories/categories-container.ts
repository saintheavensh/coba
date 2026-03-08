import { inject, injectable } from "inversify";
import { TYPES } from "./types";
import { ICategoryRepository } from "./domain";
import { CategoryVariantPropagationService } from "./domain/services/CategoryVariantPropagationService";
import {
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    AddVariantTemplateUseCase,
    RemoveVariantTemplateUseCase
} from "./application";

/**
 * CategoriesFacade — Single entry point for the Categories module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
@injectable()
export class CategoriesFacade {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository,
        @inject(TYPES.GetCategoriesUseCase) private readonly getCategoriesUseCase: GetCategoriesUseCase,
        @inject(TYPES.CreateCategoryUseCase) private readonly createCategoryUseCase: CreateCategoryUseCase,
        @inject(TYPES.UpdateCategoryUseCase) private readonly updateCategoryUseCase: UpdateCategoryUseCase,
        @inject(TYPES.DeleteCategoryUseCase) private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
        @inject(TYPES.AddVariantTemplateUseCase) private readonly addVariantTemplateUseCase: AddVariantTemplateUseCase,
        @inject(TYPES.RemoveVariantTemplateUseCase) private readonly removeVariantTemplateUseCase: RemoveVariantTemplateUseCase
    ) { }

    async getAll() {
        return await this.getCategoriesUseCase.execute();
    }

    async create(data: any) {
        return await this.createCategoryUseCase.execute(data);
    }

    async update(id: string, data: any) {
        return await this.updateCategoryUseCase.execute(id, data);
    }

    async delete(id: string) {
        return await this.deleteCategoryUseCase.execute(id);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string) {
        return await this.addVariantTemplateUseCase.execute(categoryId, name, supplierId);
    }

    async removeVariantTemplate(id: string) {
        return await this.removeVariantTemplateUseCase.execute(id);
    }

    async findById(id: string) {
        return await this.categoryRepository.findById(id);
    }
}

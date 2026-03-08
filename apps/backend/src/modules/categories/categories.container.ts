import { ContainerModule, injectable, inject } from "inversify";
import { TYPES } from "./types";
import { ICategoryRepository } from "./domain";
import { CategoryRepositoryAdapter } from "./infrastructure";
import { CategoryVariantPropagationService } from "./domain/services/CategoryVariantPropagationService";
import {
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    AddVariantTemplateUseCase,
    RemoveVariantTemplateUseCase,
    CreateCategoryInput
} from "./application";
import { Category, UpdateCategoryData, CategoryVariant } from "./domain/entities/category.entity";

/**
 * Categories Module Container
 */
export const categoriesContainerModule = new ContainerModule(({ bind }) => {
    // Repositories
    bind<ICategoryRepository>(TYPES.ICategoryRepository).to(CategoryRepositoryAdapter).inSingletonScope();

    // Services
    bind<CategoryVariantPropagationService>(TYPES.CategoryVariantPropagationService).to(CategoryVariantPropagationService).inSingletonScope();

    // Use Cases
    bind<GetCategoriesUseCase>(TYPES.GetCategoriesUseCase).to(GetCategoriesUseCase).inSingletonScope();
    bind<CreateCategoryUseCase>(TYPES.CreateCategoryUseCase).to(CreateCategoryUseCase).inSingletonScope();
    bind<UpdateCategoryUseCase>(TYPES.UpdateCategoryUseCase).to(UpdateCategoryUseCase).inSingletonScope();
    bind<DeleteCategoryUseCase>(TYPES.DeleteCategoryUseCase).to(DeleteCategoryUseCase).inSingletonScope();
    bind<AddVariantTemplateUseCase>(TYPES.AddVariantTemplateUseCase).to(AddVariantTemplateUseCase).inSingletonScope();
    bind<RemoveVariantTemplateUseCase>(TYPES.RemoveVariantTemplateUseCase).to(RemoveVariantTemplateUseCase).inSingletonScope();

    // Facade
    bind<CategoriesFacade>(TYPES.CategoriesFacade).to(CategoriesFacade).inSingletonScope();
});

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

    async getAll(): Promise<Category[]> {
        return await this.getCategoriesUseCase.execute();
    }

    async create(data: CreateCategoryInput): Promise<Category> {
        return await this.createCategoryUseCase.execute(data);
    }

    async update(id: string, data: UpdateCategoryData): Promise<Category> {
        return await this.updateCategoryUseCase.execute(id, data);
    }

    async delete(id: string): Promise<void> {
        return await this.deleteCategoryUseCase.execute(id);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string): Promise<CategoryVariant> {
        return await this.addVariantTemplateUseCase.execute(categoryId, name, supplierId);
    }

    async removeVariantTemplate(id: string): Promise<void> {
        return await this.removeVariantTemplateUseCase.execute(id);
    }

    async findById(id: string): Promise<Category | null> {
        return await this.categoryRepository.findById(id);
    }
}

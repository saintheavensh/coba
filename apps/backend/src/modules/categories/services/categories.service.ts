import { DBContext } from "../../../shared/types/db-context";
import { CategoryRepositoryAdapter } from "../infrastructure";
import {
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    AddVariantTemplateUseCase,
    RemoveVariantTemplateUseCase,
    CreateCategoryInput
} from "../application";
import { ICategoryRepository } from "../domain";

export class CategoriesService {
    private repository: ICategoryRepository;
    private getCategoriesUseCase: GetCategoriesUseCase;
    private createCategoryUseCase: CreateCategoryUseCase;
    private updateCategoryUseCase: UpdateCategoryUseCase;
    private deleteCategoryUseCase: DeleteCategoryUseCase;
    private addVariantTemplateUseCase: AddVariantTemplateUseCase;
    private removeVariantTemplateUseCase: RemoveVariantTemplateUseCase;

    constructor() {
        this.repository = new CategoryRepositoryAdapter();
        this.getCategoriesUseCase = new GetCategoriesUseCase(this.repository);
        this.createCategoryUseCase = new CreateCategoryUseCase(this.repository);
        this.updateCategoryUseCase = new UpdateCategoryUseCase(this.repository);
        this.deleteCategoryUseCase = new DeleteCategoryUseCase(this.repository);
        this.addVariantTemplateUseCase = new AddVariantTemplateUseCase(this.repository);
        this.removeVariantTemplateUseCase = new RemoveVariantTemplateUseCase(this.repository);
    }

    async getAll(dbOrTx?: DBContext) {
        return await this.getCategoriesUseCase.execute(dbOrTx);
    }

    async create(data: CreateCategoryInput, dbOrTx?: DBContext) {
        return await this.createCategoryUseCase.execute(data, dbOrTx);
    }

    async update(id: string, data: any, dbOrTx?: DBContext) {
        return await this.updateCategoryUseCase.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext) {
        return await this.deleteCategoryUseCase.execute(id, dbOrTx);
    }

    async addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext) {
        return await this.addVariantTemplateUseCase.execute(categoryId, name, supplierId, dbOrTx);
    }

    async removeVariantTemplate(id: number, dbOrTx?: DBContext) {
        return await this.removeVariantTemplateUseCase.execute(id, dbOrTx);
    }
}

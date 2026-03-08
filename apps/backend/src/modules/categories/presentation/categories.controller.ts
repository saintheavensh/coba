import { inject, injectable } from "inversify";
import { AppHonoContext } from "../../../shared/types/app-context";
import { CategoriesFacade } from "../categories.container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";
import { TYPES } from "../types";
import { UpdateCategoryData } from "../domain/entities/category.entity";
import { CreateCategoryInput } from "../application/use-cases/create-category.use-case";

@injectable()
export class CategoriesController {
    constructor(
        @inject(TYPES.CategoriesFacade) private readonly facade: CategoriesFacade
    ) { }

    async getAll(c: AppHonoContext) {
        try {
            const list = await this.facade.getAll();
            return apiSuccess(c, list, "Categories retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve categories", 500);
        }
    }

    async create(c: AppHonoContext) {
        try {
            const data = await c.req.json<CreateCategoryInput>();
            const result = await this.facade.create(data);
            return apiSuccess(c, result, "Category created successfully", 201);
        } catch (e: unknown) {
            return apiError(c, e, "Failed to create category", 500);
        }
    }

    async update(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const data = await c.req.json<UpdateCategoryData>();
            await this.facade.update(id, data);
            return apiSuccess(c, null, "Category updated successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to update category", 500);
        }
    }

    async delete(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            await this.facade.delete(id);
            return apiSuccess(c, null, "Category deleted successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to delete category", 400);
        }
    }

    async addVariantTemplate(c: AppHonoContext) {
        try {
            const categoryId = c.req.param("id")!;
            const { name, supplierId } = await c.req.json<{ name: string, supplierId?: string }>();
            const result = await this.facade.addVariantTemplate(categoryId, name, supplierId);
            return apiSuccess(c, result, "Variant template added");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to add variant template", 500);
        }
    }

    async removeVariantTemplate(c: AppHonoContext) {
        try {
            const variantId = c.req.param("variantId")!;
            await this.facade.removeVariantTemplate(variantId);
            return apiSuccess(c, null, "Variant template removed");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to remove variant template", 500);
        }
    }
}

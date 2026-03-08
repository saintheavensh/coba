import { AppHonoContext } from "../../../shared/types/app-context";
import { SuppliersFacade } from "../suppliers-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { CreateSupplierData, UpdateSupplierData } from "../domain";

@injectable()
export class SuppliersController {
    constructor(
        @inject(TYPES.SuppliersFacade) private readonly facade: SuppliersFacade
    ) { }

    async getAll(c: AppHonoContext) {
        try {
            const list = await this.facade.getAll();
            return apiSuccess(c, list, "Suppliers retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve suppliers", 500);
        }
    }

    async getLinkedCategories(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const list = await this.facade.getLinkedCategories(id);
            return apiSuccess(c, list, "Supplier categories retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve supplier categories", 500);
        }
    }

    async create(c: AppHonoContext) {
        try {
            const data = await c.req.json<CreateSupplierData>();
            const result = await this.facade.create(data);
            return apiSuccess(c, result, "Supplier created successfully", 201);
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("Validation")) {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to create supplier", 500);
        }
    }

    async update(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const data = await c.req.json<UpdateSupplierData>();
            await this.facade.update(id, data);
            return apiSuccess(c, null, "Supplier updated successfully");
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes("Validation")) {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to update supplier", 500);
        }
    }

    async delete(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            await this.facade.delete(id);
            return apiSuccess(c, null, "Supplier deleted successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to delete supplier", 400);
        }
    }

    async linkCategory(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const { categoryId } = await c.req.json<{ categoryId: string }>();
            await this.facade.linkCategory(id, categoryId);
            return apiSuccess(c, null, "Category linked successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to link category", 500);
        }
    }

    async unlinkCategory(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const categoryId = c.req.param("categoryId")!;
            await this.facade.unlinkCategory(id, categoryId);
            return apiSuccess(c, null, "Category unlinked successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to unlink category", 500);
        }
    }

    async getMappedProductVariants(c: AppHonoContext) {
        try {
            const supplierId = c.req.param("id")!;
            const list = await this.facade.getMappedProductVariants(supplierId);
            return apiSuccess(c, list, "Mapped product variants retrieved successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to retrieve mapped product variants", 500);
        }
    }

    async mapProductVariant(c: AppHonoContext) {
        try {
            const supplierId = c.req.param("id")!;
            const body = await c.req.json<{ productId: string, variantId?: string }>();
            await this.facade.mapProductVariant(supplierId, body.productId, body.variantId ?? null);
            return apiSuccess(c, null, "Product variant mapped successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to map product variant", 500);
        }
    }

    async unmapProductVariant(c: AppHonoContext) {
        try {
            const supplierId = c.req.param("id");
            const productId = c.req.param("productId");
            if (!supplierId || !productId) return apiError(c, null, "Supplier ID and Product ID are required", 400);

            const variantId = c.req.query("variantId");
            if (!variantId) return apiError(c, null, "variantId is required", 400);

            await this.facade.unmapProductVariant(supplierId!, productId!, variantId!);
            return apiSuccess(c, null, "Product variant unmapped successfully");
        } catch (e: unknown) {
            return apiError(c, e, "Failed to unmap product variant", 500);
        }
    }
}

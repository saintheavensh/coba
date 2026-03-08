import type { AppHonoContext } from "../../../shared/types/app-context";
import { productsService } from "../products-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";
import { CreateProductDTO } from "../application/dtos/CreateProductDTO";
import { UpdateProductDTO } from "../application/dtos/UpdateProductDTO";

export class ProductsController {
    constructor(private readonly service: typeof productsService = productsService) { }

    /**
     * Get paginated list of products
     * @route GET /api/products
     * @param c - Hono context with query parameters (page, limit, sortBy, sortOrder)
     * @returns 200 with paginated products or 500 on error
     */
    async getAllProducts(c: AppHonoContext) {
        try {
            const { search, categoryId, page, limit } = c.req.query();
            const result = await this.service.getAllProducts(
                search,
                categoryId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );
            return apiSuccess(c, result.data, "Products retrieved successfully", 200, result.meta);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c as any, message, "Failed to retrieve products");
        }
    }

    async getProductById(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const result = await this.service.getProduct(id);
            if (result.isFailure) return apiError(c as any, result.errorValue() as string, "Product not found", 404);
            return apiSuccess(c, result.getValue());
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c as any, message, "Failed to retrieve product");
        }
    }

    async createProduct(c: AppHonoContext) {
        try {
            const data = c.req.valid("json" as any) as CreateProductDTO;
            const result = await this.service.createProduct(data);
            if (result.isFailure) return apiError(c as any, result.errorValue() as unknown as any, "Failed to create product", 400);
            return apiSuccess(c, result.getValue(), "Product created", 201);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c as any, message, "Failed to create product");
        }
    }

    async updateProduct(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const data = c.req.valid("json" as any) as UpdateProductDTO;
            const result = await this.service.updateProduct(id, data);
            if (result.isFailure) return apiError(c as any, result.errorValue() as unknown as any, "Failed to update product", 400);
            return apiSuccess(c, result.getValue(), "Product updated");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c as any, message, "Failed to update product");
        }
    }

    async deleteProduct(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const result = await this.service.deleteProduct(id);
            if (result.isFailure) return apiError(c, result.errorValue() as string, "Failed to delete product", 400);
            return apiSuccess(c, null, "Product deleted");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to delete product");
        }
    }

    async searchProduct(c: AppHonoContext) {
        try {
            const { q } = c.req.query();
            const results = await this.service.searchProduct(q || "");
            return apiSuccess(c, results);
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to search product");
        }
    }

    async getStats(c: AppHonoContext) {
        try {
            const result = await this.service.getStats();
            return apiSuccess(c, result, "Stats retrieved");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return apiError(c, message, "Failed to get stats", 500);
        }
    }

    async getProductCountByCategory(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const result = await this.service.getProductCountByCategory(id);
            return apiSuccess(c, { count: result }, "Count retrieved");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to get count", 500);
        }
    }

    async getSupplierVariants(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const result = await this.service.getSupplierVariants(id);
            return apiSuccess(c, result, "Variants retrieved");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to get variants", 500);
        }
    }

    async getProductVariants(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const supplierId = c.req.query("supplierId");
            const result = await this.service.getProductVariants(id, supplierId ?? undefined);
            return apiSuccess(c, result, "Variants retrieved");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to get variants", 500);
        }
    }

    async createVariant(c: AppHonoContext) {
        try {
            const data = c.req.valid("json" as any) as any;
            const result = await this.service.createVariant(data);
            return apiSuccess(c, result, "Variant created", 201);
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to create variant", 500);
        }
    }

    async updateVariant(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const data = c.req.valid("json" as any) as any;
            const result = await this.service.updateVariant(id, data);
            return apiSuccess(c, result, "Variant updated");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to update variant", 500);
        }
    }

    async deleteVariant(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            await this.service.deleteVariant(id);
            return apiSuccess(c, null, "Variant deleted");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to delete variant", 500);
        }
    }

    async bulkUpdateMinStock(c: AppHonoContext) {
        try {
            const data = c.req.valid("json" as any) as unknown;
            await this.service.bulkUpdateMinStock(data);
            return apiSuccess(c, null, "Min stock updated");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to update min stock", 500);
        }
    }

    async printLabel(c: AppHonoContext) {
        try {
            const data = c.req.valid("json" as any) as unknown;
            const result = await this.service.printLabel(data);
            return apiSuccess(c, result, "Label printed");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to print label", 500);
        }
    }

}

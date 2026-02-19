import { Context } from "hono";
import { InventoryService } from "../services/inventory.service";
import { PrintService } from "../../../services/print.service";
import { apiSuccess, apiError } from "../../../lib/response";
import { Logger } from "../../../lib/logger";

export class InventoryController {
    private service: InventoryService;
    private printService: PrintService;

    constructor() {
        this.service = new InventoryService();
        this.printService = new PrintService();
    }

    async getSupplierVariants(c: Context) {
        try {
            const id = c.req.param("id");
            const variants = await this.service.getSupplierVariants(id);
            return apiSuccess(c, variants);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve supplier variants");
        }
    }

    async getStats(c: Context) {
        try {
            const stats = await this.service.getStats();
            return apiSuccess(c, stats, "Inventory stats retrieved");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve inventory stats");
        }
    }

    async getAllProducts(c: Context) {
        try {
            const deviceId = c.req.query("deviceId");
            const search = c.req.query("search");
            const categoryId = c.req.query("categoryId");
            const list = await this.service.getAllProducts(deviceId, search, categoryId);
            return apiSuccess(c, list, "Products retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve products", 500);
        }
    }

    async getProductVariants(c: Context) {
        try {
            const id = c.req.param("id");
            const supplierId = c.req.query("supplierId");
            const list = await this.service.getProductVariants(id, supplierId);
            return apiSuccess(c, list);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve variants", 500);
        }
    }

    async getProductById(c: Context) {
        try {
            const id = c.req.param("id");
            const product = await this.service.getProductById(id);
            if (!product) return apiError(c, null, "Product not found", 404);
            return apiSuccess(c, product, "Product retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to retrieve product", 500);
        }
    }

    async createProduct(c: Context) {
        try {
            const user = c.get("user");
            const data = (c.req as any).valid("json");
            const result = await this.service.createProduct(data, user);
            return apiSuccess(c, result, "Product created successfully", 201);
        } catch (e) {
            Logger.error("[CREATE_PRODUCT_ERROR]", e);
            return apiError(c, e, "Failed to create product", 500);
        }
    }

    async updateProduct(c: Context) {
        try {
            const user = c.get("user");
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            await this.service.updateProduct(id, data, user);
            return apiSuccess(c, null, "Product updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update product", 500);
        }
    }

    async deleteProduct(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.deleteProduct(id);
            return apiSuccess(c, null, "Product deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete product", 400);
        }
    }

    async createVariant(c: Context) {
        try {
            const user = c.get("user");
            const data = (c.req as any).valid("json");
            const result = await this.service.createVariant(data, user);
            return apiSuccess(c, result, "Variant created successfully", 201);
        } catch (e) {
            return apiError(c, e, "Failed to create variant", 500);
        }
    }

    async updateVariant(c: Context) {
        try {
            const user = c.get("user");
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const result = await this.service.updateVariant(id, data, user);
            return apiSuccess(c, result, "Variant updated successfully");
        } catch (e) {
            return apiError(c, e, "Failed to update variant", 500);
        }
    }

    async deleteVariant(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.deleteVariant(id);
            return apiSuccess(c, null, "Variant deleted successfully");
        } catch (e) {
            return apiError(c, e, "Failed to delete variant", 400);
        }
    }

    async getProductCountByCategory(c: Context) {
        try {
            const categoryId = c.req.param("id");
            const count = await this.service.getProductCountByCategory(categoryId);
            return apiSuccess(c, { count }, "Product count retrieved successfully");
        } catch (e) {
            return apiError(c, e, "Failed to get product count", 500);
        }
    }

    async bulkUpdateMinStock(c: Context) {
        try {
            const user = c.get("user");
            const { categoryId, minStock } = (c.req as any).valid("json");
            const updatedCount = await this.service.bulkUpdateMinStock(categoryId, minStock, user);
            return apiSuccess(c, { updatedCount }, `${updatedCount} products updated successfully`);
        } catch (e) {
            Logger.error("[BULK_MIN_STOCK_ERROR]", e);
            return apiError(c, e, "Failed to update minimum stock", 500);
        }
    }

    async searchProduct(c: Context) {
        try {
            const search = c.req.query("search");
            const results = await this.service.searchProduct(search);
            return apiSuccess(c, results, "Products searched successfully");
        } catch (e) {
            return apiError(c, e, "Failed to search products", 500);
        }
    }

    async printLabel(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.printService.printProductLabel(data);
            if (!result.success) throw result.error;
            return apiSuccess(c, null, "Label printed successfully");
        } catch (e) {
            return apiError(c, e, "Failed to print label", 500);
        }
    }
}

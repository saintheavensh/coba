// @ts-nocheck
/**
 * Products controller — handles HTTP requests and delegates to ProductsService.
 * Injected via constructor (DI pattern).
 */
import type { Context } from "hono";
import { productsService } from "../products-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class ProductsController {
    constructor(private readonly service: typeof productsService = productsService) { }

    /**
     * Get paginated list of products
     * @route GET /api/products
     * @param c - Hono context with query parameters (page, limit, sortBy, sortOrder)
     * @returns 200 with paginated products or 500 on error
     */
    async getAllProducts(c: Context) {
        try {
            const { search, categoryId, deviceId } = c.req.query();
            const result = await this.service.getAllProducts(deviceId, search, categoryId);
            return apiSuccess(c, result.data, "Products retrieved successfully", 200, result.meta);
        } catch (e: any) {
            console.error('ProductsController.getAllProducts Error:', e);
            return apiError(c, e, "Failed to retrieve products");
        }
    }

    /**
     * Get product by ID
     * @route GET /api/products/{id}
     * @param c - Hono context with product ID in params
     * @returns 200 with product data, 404 if not found, or 500 on error
     */
    async getProductById(c: Context) {
        try {
            const id = c.req.param("id");
            const product = await this.service.getProductById(id);
            if (!product) return apiError(c, null, "Product not found", 404);
            return apiSuccess(c, product);
        } catch (e: any) {
            console.error('ProductsController.getProductById Error:', e);
            return apiError(c, e, "Failed to retrieve product");
        }
    }

    /**
     * Create new product
     * @route POST /api/products
     * @param c - Hono context with product data in body
     * @returns 201 with created product, 400 if validation fails, or 500 on error
     */
    async createProduct(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const product = await this.service.createProduct(data, user);
            return c.json(product, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Update product by ID
     * @route PUT /api/products/{id}
     * @param c - Hono context with product ID in params and update data in body
     * @returns 200 with updated product, 400 if validation fails, or 500 on error
     */
    async updateProduct(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const product = await this.service.updateProduct(id, data, user);
            return c.json(product);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Delete product by ID
     * @route DELETE /api/products/{id}
     * @param c - Hono context with product ID in params
     * @returns 200 on success, or 500 on error
     */
    async deleteProduct(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.deleteProduct(id);
            return c.json({ message: "deleted" });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Get variants for a specific supplier
     * @route GET /api/products/suppliers/{id}/variants
     * @param c - Hono context with supplier ID in params
     * @returns 200 with list of variants or 500 on error
     */
    async getSupplierVariants(c: Context) {
        try {
            const supplierId = c.req.param("id");
            const variants = await this.service.getSupplierVariants(supplierId);
            return c.json(variants);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Create a new product variant
     * @route POST /api/products/variants
     * @param c - Hono context with variant data in body
     * @returns 201 with created variant or 500 on error
     */
    async createVariant(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const variant = await this.service.createVariant(data, user);
            return c.json(variant, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Update an existing product variant
     * @route PUT /api/products/variants/{id}
     * @param c - Hono context with variant ID and update data
     * @returns 200 with updated variant or 500 on error
     */
    async updateVariant(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const variant = await this.service.updateVariant(id, data, user);
            return c.json(variant);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Get variants for a specific product
     * @route GET /api/products/{id}/variants
     * @param c - Hono context with product ID
     * @returns 200 with list of variants or 500 on error
     */
    async getProductVariants(c: Context) {
        try {
            const productId = c.req.param("id");
            const { supplierId } = c.req.query();
            const variants = await this.service.getProductVariants(productId, supplierId);
            return c.json(variants);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Delete a product variant
     * @route DELETE /api/products/variants/{id}
     * @param c - Hono context with variant ID
     * @returns 200 on success, or 500 on error
     */
    async deleteVariant(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.deleteVariant(id);
            return c.json({ message: "deleted" });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Bulk update minimum stock levels for products in a category
     * @route PATCH /api/products/bulk-min-stock
     * @param c - Hono context with category ID and new min stock values
     * @returns 200 with update count or 500 on error
     */
    async bulkUpdateMinStock(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const count = await this.service.bulkUpdateMinStock(data.categoryId, data.minStock, user);
            return c.json({ message: `Updated ${count} products`, count });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Get total product count for a specific category
     * @route GET /api/products/categories/{id}/product-count
     * @param c - Hono context with category ID
     * @returns 200 with product count or 500 on error
     */
    async getProductCountByCategory(c: Context) {
        try {
            const categoryId = c.req.param("id");
            const count = await this.service.getProductCountByCategory(categoryId);
            return c.json({ count });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    /**
     * Get aggregate product statistics
     * @route GET /api/products/stats
     * @param c - Hono context
     * @returns 200 with statistics object or 500 on error
     */
    async getStats(c: Context) {
        try {
            const stats = await this.service.getStats();
            return apiSuccess(c, stats, "Statistics retrieved successfully");
        } catch (e: any) {
            console.error('ProductsController.getStats Error:', e);
            return apiError(c, e, "Failed to retrieve statistics");
        }
    }

    /**
     * Search products by keyword
     * @route GET /api/products/searchproduct
     * @param c - Hono context with search query 'q'
     * @returns 200 with search results or 500 on error
     */
    async searchProduct(c: Context) {
        try {
            const { q } = c.req.query();
            const results = await this.service.searchProduct(q);
            return apiSuccess(c, results);
        } catch (e: any) {
            console.error('ProductsController.searchProduct Error:', e);
            return apiError(c, e, "Failed to search product");
        }
    }

    /**
     * Print label for products
     * @route POST /api/products/print-label
     * @param c - Hono context with label criteria
     * @returns 200 with print results or 500 on error
     */
    async printLabel(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await this.service.printLabel(data);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

/**
 * Inventory controller — handles HTTP requests and delegates to the application service.
 * No direct infrastructure dependencies (PrintService removed).
 */
import type { Context } from "hono";
import { inventoryApplicationService } from "../inventory-container";

export class InventoryController {
    async getAllProducts(c: Context) {
        try {
            const { search, categoryId, deviceId } = c.req.query();
            const products = await inventoryApplicationService.getAllProducts(deviceId, search, categoryId);
            return c.json(products);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getProductById(c: Context) {
        try {
            const id = c.req.param("id");
            const product = await inventoryApplicationService.getProductById(id);
            if (!product) return c.json({ error: "Not found" }, 404);
            return c.json(product);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async createProduct(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const product = await inventoryApplicationService.createProduct(data, user);
            return c.json(product, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async updateProduct(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const product = await inventoryApplicationService.updateProduct(id, data, user);
            return c.json(product);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async deleteProduct(c: Context) {
        try {
            const id = c.req.param("id");
            await inventoryApplicationService.deleteProduct(id);
            return c.json({ message: "deleted" });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getSupplierVariants(c: Context) {
        try {
            const supplierId = c.req.param("id");
            const variants = await inventoryApplicationService.getSupplierVariants(supplierId);
            return c.json(variants);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async createVariant(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const variant = await inventoryApplicationService.createVariant(data, user);
            return c.json(variant, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async updateVariant(c: Context) {
        try {
            const id = c.req.param("id");
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const variant = await inventoryApplicationService.updateVariant(id, data, user);
            return c.json(variant);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getProductVariants(c: Context) {
        try {
            const productId = c.req.param("id");
            const { supplierId } = c.req.query();
            const variants = await inventoryApplicationService.getProductVariants(productId, supplierId);
            return c.json(variants);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async deleteVariant(c: Context) {
        try {
            const id = c.req.param("id");
            await inventoryApplicationService.deleteVariant(id);
            return c.json({ message: "deleted" });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async bulkUpdateMinStock(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const user = c.get("user");
            const count = await inventoryApplicationService.bulkUpdateMinStock(data.categoryId, data.minStock, user);
            return c.json({ message: `Updated ${count} products`, count });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getProductCountByCategory(c: Context) {
        try {
            const categoryId = c.req.param("id");
            const count = await inventoryApplicationService.getProductCountByCategory(categoryId);
            return c.json({ count });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async getStats(c: Context) {
        try {
            const stats = await inventoryApplicationService.getStats();
            return c.json(stats);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async searchProduct(c: Context) {
        try {
            const { q } = c.req.query();
            const results = await inventoryApplicationService.searchProduct(q);
            return c.json(results);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    async printLabel(c: Context) {
        try {
            const data = (c.req as any).valid("json");
            const result = await inventoryApplicationService.printLabel(data);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

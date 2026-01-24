import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { z } from "zod";
import { InventoryService } from "./inventory.service";
import { apiSuccess, apiError } from "../../lib/response";
import { Logger } from "../../lib/logger";

const app = new Hono();
const service = new InventoryService();

// Get Product Variants (Distinct from batches)
app.get("/suppliers/:id/variants", async (c) => {
    const id = c.req.param("id");
    const variants = await service.getSupplierVariants(id);
    return apiSuccess(c, variants);
});

app.get("/", async (c) => {
    try {
        const deviceId = c.req.query("deviceId");
        const list = await service.getAllProducts(deviceId);
        return apiSuccess(c, list, "Products retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to retrieve products", 500);
    }
});

app.get("/:id/variants", async (c) => {
    try {
        const id = c.req.param("id");
        const list = await service.getProductVariants(id);
        return apiSuccess(c, list);
    } catch (e) {
        return apiError(c, e, "Failed to retrieve variants", 500);
    }
});

app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const product = await service.getProductById(id);
        if (!product) return apiError(c, null, "Product not found", 404);
        return apiSuccess(c, product, "Product retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to retrieve product", 500);
    }
});

app.post("/", zValidator("json", productSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const result = await service.createProduct(data);
        return apiSuccess(c, result, "Product created successfully", 201);
    } catch (e) {
        Logger.error("[CREATE_PRODUCT_ERROR]", e);
        return apiError(c, e, "Failed to create product", 500);
    }
});

app.put("/:id", zValidator("json", productSchema), async (c) => {
    try {
        const id = c.req.param("id");
        const data = c.req.valid("json");
        await service.updateProduct(id, data);
        return apiSuccess(c, null, "Product updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update product", 500);
    }
});

app.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await service.deleteProduct(id);
        return apiSuccess(c, null, "Product deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete product", 400); // Service usually throws if foreign key constraint
    }
});



// Variants Endpoints
const variantSchema = z.object({
    productId: z.string(),
    name: z.string(),
    image: z.string().optional(),
    sku: z.string().optional(),
    defaultPrice: z.number().optional()
});

app.post("/variants", zValidator("json", variantSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const result = await service.createVariant(data);
        return apiSuccess(c, result, "Variant created successfully", 201);
    } catch (e) {
        return apiError(c, e, "Failed to create variant", 500);
    }
});

app.put("/variants/:id", zValidator("json", variantSchema.partial().omit({ productId: true })), async (c) => {
    try {
        const id = c.req.param("id");
        const data = c.req.valid("json");
        const result = await service.updateVariant(id, data);
        return apiSuccess(c, result, "Variant updated successfully");
    } catch (e) {
        return apiError(c, e, "Failed to update variant", 500);
    }
});

app.delete("/variants/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await service.deleteVariant(id);
        return apiSuccess(c, null, "Variant deleted successfully");
    } catch (e) {
        return apiError(c, e, "Failed to delete variant", 400);
    }
});

export default app;

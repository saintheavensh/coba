import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { InventoryService } from "./inventory.service";
import { apiSuccess, apiError } from "../../lib/response";

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
        const list = await service.getAllProducts();
        return apiSuccess(c, list, "Products retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to retrieve products", 500);
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
        console.error("[CREATE_PRODUCT_ERROR]", e);
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



export default app;

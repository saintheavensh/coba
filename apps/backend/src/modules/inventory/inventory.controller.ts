import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { z } from "zod";
import { InventoryService } from "./inventory.service";
import { StockOpnameService } from "./stock-opname.service";
import { apiSuccess, apiError } from "../../lib/response";
import { Logger } from "../../lib/logger";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new InventoryService();
const stockOpnameService = new StockOpnameService();

// Get Product Variants (Distinct from batches)
app.get("/suppliers/:id/variants", async (c) => {
    const id = c.req.param("id");
    const variants = await service.getSupplierVariants(id);
    return apiSuccess(c, variants);
});

app.get("/", async (c) => {
    try {
        const deviceId = c.req.query("deviceId");
        const search = c.req.query("search");
        const categoryId = c.req.query("categoryId");
        const list = await service.getAllProducts(deviceId, search, categoryId);
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

// Bulk Min Stock Endpoints
const bulkMinStockSchema = z.object({
    categoryId: z.string().min(1, "Category ID is required"),
    minStock: z.number().min(0, "Min stock must be 0 or greater")
});

// Get product count by category (for preview)
app.get("/categories/:id/product-count", async (c) => {
    try {
        const categoryId = c.req.param("id");
        const count = await service.getProductCountByCategory(categoryId);
        return apiSuccess(c, { count }, "Product count retrieved successfully");
    } catch (e) {
        return apiError(c, e, "Failed to get product count", 500);
    }
});

// Bulk update min stock for all products in a category
app.patch("/bulk-min-stock", zValidator("json", bulkMinStockSchema), async (c) => {
    try {
        const { categoryId, minStock } = c.req.valid("json");
        const updatedCount = await service.bulkUpdateMinStock(categoryId, minStock);
        return apiSuccess(c, { updatedCount }, `${updatedCount} products updated successfully`);
    } catch (e) {
        Logger.error("[BULK_MIN_STOCK_ERROR]", e);
        return apiError(c, e, "Failed to update minimum stock", 500);
    }
});

// ============================================
// STOCK OPNAME ROUTES
// ============================================

app.get("/opname/sessions", authMiddleware, async (c) => {
    try {
        const data = await stockOpnameService.getSessions();
        return apiSuccess(c, data);
    } catch (e) {
        Logger.error("[GET_OPNAME_SESSIONS_ERROR]", e);
        return apiError(c, e, "Failed to get stock opname sessions");
    }
});

app.get("/opname/adjustment-history", authMiddleware, async (c) => {
    try {
        const data = await stockOpnameService.getAdjustmentHistory();
        return apiSuccess(c, data);
    } catch (e) {
        Logger.error("[GET_ADJUSTMENT_HISTORY_ERROR]", e);
        return apiError(c, e, "Failed to get adjustment history");
    }
});

app.post("/opname/sessions", authMiddleware, async (c) => {
    try {
        const user = c.get("jwtPayload") as any;
        const { notes, categoryId } = await c.req.json();
        const sessionId = await stockOpnameService.createSession(user.id, notes, categoryId);
        return apiSuccess(c, { id: sessionId }, "Stock opname session created", 201);
    } catch (e) {
        Logger.error("[CREATE_OPNAME_SESSION_ERROR]", e);
        return apiError(c, e, "Failed to create stock opname session");
    }
});

app.get("/opname/sessions/:id", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        const data = await stockOpnameService.getSessionDetails(id);
        if (!data) return apiError(c, null, "Session not found", 404);
        return apiSuccess(c, data);
    } catch (e) {
        Logger.error("[GET_OPNAME_SESSION_DETAILS_ERROR]", e);
        return apiError(c, e, "Failed to get session details");
    }
});

app.put("/opname/items/:itemId", authMiddleware, async (c) => {
    try {
        const itemId = parseInt(c.req.param("itemId"));
        const { physicalStock, reason } = await c.req.json();
        const result = await stockOpnameService.updateItem(itemId, physicalStock, reason);
        return apiSuccess(c, result, "Item updated");
    } catch (e) {
        return apiError(c, e, "Failed to update item");
    }
});

app.post("/opname/sessions/:id/finalize", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        const user = c.get("jwtPayload") as any;
        const result = await stockOpnameService.finalizeSession(id, user.id);
        return apiSuccess(c, result, "Session finalized and stock adjusted");
    } catch (e) {
        return apiError(c, e, "Failed to finalize session");
    }
});

app.post("/opname/sessions/:id/cancel", authMiddleware, async (c) => {
    try {
        const id = c.req.param("id");
        const user = c.get("jwtPayload") as any;
        await stockOpnameService.cancelSession(id, user.id);
        return apiSuccess(c, null, "Session cancelled");
    } catch (e) {
        return apiError(c, e, "Failed to cancel session");
    }
});

export default app;


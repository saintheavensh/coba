import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { z } from "zod";
import { InventoryController } from "../controllers/inventory.controller";
import { StockOpnameController } from "../controllers/stock-opname.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new InventoryController();
const stockOpnameController = new StockOpnameController();

// Variant Schema
const variantSchema = z.object({
    productId: z.string(),
    name: z.string(),
    image: z.string().optional(),
    sku: z.string().optional(),
    defaultPrice: z.number().optional()
});

// Bulk Min Stock Schema
const bulkMinStockSchema = z.object({
    categoryId: z.string().min(1, "Category ID is required"),
    minStock: z.number().min(0, "Min stock must be 0 or greater")
});

// ============================================
// INVENTORY ROUTES
// ============================================

app.get("/suppliers/:id/variants", (c) => controller.getSupplierVariants(c));
app.get("/stats", (c) => controller.getStats(c));
app.get("/", (c) => controller.getAllProducts(c));
app.get("/:id/variants", (c) => controller.getProductVariants(c));
app.get("/:id", (c) => controller.getProductById(c));

app.post("/", zValidator("json", productSchema), (c) => controller.createProduct(c));
app.put("/:id", zValidator("json", productSchema), (c) => controller.updateProduct(c));
app.delete("/:id", (c) => controller.deleteProduct(c));

// Variants
app.post("/variants", zValidator("json", variantSchema), (c) => controller.createVariant(c));
app.put("/variants/:id", zValidator("json", variantSchema.partial().omit({ productId: true })), (c) => controller.updateVariant(c));
app.delete("/variants/:id", (c) => controller.deleteVariant(c));

// Bulk Min Stock
app.get("/categories/:id/product-count", (c) => controller.getProductCountByCategory(c));
app.patch("/bulk-min-stock", zValidator("json", bulkMinStockSchema), (c) => controller.bulkUpdateMinStock(c));

// ============================================
// STOCK OPNAME ROUTES
// ============================================

app.get("/opname/sessions", authMiddleware, (c) => stockOpnameController.getSessions(c));
app.get("/opname/adjustment-history", authMiddleware, (c) => stockOpnameController.getAdjustmentHistory(c));
app.post("/opname/sessions", authMiddleware, (c) => stockOpnameController.createSession(c));
app.get("/opname/sessions/:id", authMiddleware, (c) => stockOpnameController.getSessionDetails(c));
app.put("/opname/items/:itemId", authMiddleware, (c) => stockOpnameController.updateItem(c));
app.post("/opname/sessions/:id/finalize", authMiddleware, (c) => stockOpnameController.finalizeSession(c));
app.post("/opname/sessions/:id/cancel", authMiddleware, (c) => stockOpnameController.cancelSession(c));

export default app;

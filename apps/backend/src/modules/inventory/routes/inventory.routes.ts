import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { z } from "zod";
import { InventoryController } from "../controllers/inventory.controller";
import { StockOpnameController } from "../controllers/stock-opname.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

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

const labelSchema = z.object({
    productName: z.string(),
    variantName: z.string().optional(),
    code: z.string(),
    price: z.number().optional()
});

// ============================================
// INVENTORY ROUTES
// ============================================

app.get("/suppliers/:id/variants", (c) => controller.getSupplierVariants(c));
app.get("/stats", (c) => controller.getStats(c));
app.get("/", (c) => controller.getAllProducts(c));
app.get("/:id/variants", (c) => controller.getProductVariants(c));
app.get("/searchproduct", authMiddleware, (c) => controller.searchProduct(c));
app.get("/:id", (c) => controller.getProductById(c));

app.post("/", authMiddleware, requirePermission("inventory.manage"), zValidator("json", productSchema), (c) => controller.createProduct(c));
app.put("/:id", authMiddleware, requirePermission("inventory.manage"), zValidator("json", productSchema), (c) => controller.updateProduct(c));
app.delete("/:id", authMiddleware, requirePermission("inventory.manage"), (c) => controller.deleteProduct(c));

// Variants
app.post("/variants", authMiddleware, requirePermission("inventory.manage"), zValidator("json", variantSchema), (c) => controller.createVariant(c));
app.put("/variants/:id", authMiddleware, requirePermission("inventory.manage"), zValidator("json", variantSchema.partial().omit({ productId: true })), (c) => controller.updateVariant(c));
app.delete("/variants/:id", authMiddleware, requirePermission("inventory.manage"), (c) => controller.deleteVariant(c));

// Bulk Min Stock
app.get("/categories/:id/product-count", (c) => controller.getProductCountByCategory(c));
app.patch("/bulk-min-stock", authMiddleware, requirePermission("inventory.manage"), zValidator("json", bulkMinStockSchema), (c) => controller.bulkUpdateMinStock(c));
app.post("/print-label", authMiddleware, requirePermission("inventory.manage"), zValidator("json", labelSchema), (c) => controller.printLabel(c));

// ============================================
// STOCK OPNAME ROUTES
// ============================================

app.get("/opname/sessions", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getSessions(c));
app.get("/opname/adjustment-history", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getAdjustmentHistory(c));
app.post("/opname/sessions", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.createSession(c));
app.get("/opname/sessions/:id", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getSessionDetails(c));
app.put("/opname/items/:itemId", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.updateItem(c));
app.post("/opname/sessions/:id/finalize", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.finalizeSession(c));
app.post("/opname/sessions/:id/cancel", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.cancelSession(c));

export default app;

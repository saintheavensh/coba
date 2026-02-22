/**
 * Inventory API routes — schemas imported from presentation/schemas/.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { productSchema } from "@repo/shared";
import { InventoryController } from "./inventory.controller";
import { StockOpnameController } from "./stock-opname.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";
import { variantSchema } from "./schemas/variant.schema";
import { bulkMinStockSchema } from "./schemas/bulk-min-stock.schema";
import { labelSchema } from "./schemas/label.schema";

const app = new Hono();
const controller = new InventoryController();
const stockOpnameController = new StockOpnameController();

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

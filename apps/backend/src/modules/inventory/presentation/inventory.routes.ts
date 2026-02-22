/**
 * Inventory API routes — now only stock opname routes.
 * Product CRUD routes moved to the products module.
 */
import { Hono } from "hono";
import { StockOpnameController } from "./stock-opname.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const app = new Hono();
const stockOpnameController = new StockOpnameController();

// ============================================
// STOCK OPNAME ROUTES (all that remains in /inventory)
// ============================================

app.get("/opname/sessions", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getSessions(c));
app.get("/opname/adjustment-history", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getAdjustmentHistory(c));
app.post("/opname/sessions", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.createSession(c));
app.get("/opname/sessions/:id", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.getSessionDetails(c));
app.put("/opname/items/:itemId", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.updateItem(c));
app.post("/opname/sessions/:id/finalize", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.finalizeSession(c));
app.post("/opname/sessions/:id/cancel", authMiddleware, requirePermission("inventory.manage"), (c) => stockOpnameController.cancelSession(c));

export default app;

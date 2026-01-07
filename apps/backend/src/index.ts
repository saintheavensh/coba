import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import { users } from "./db/schema";
import { sql } from "drizzle-orm";

import authController from "./modules/auth/auth.controller";
// import inventory from "./routes/inventory"; // Old
import inventoryController from "./modules/inventory/inventory.controller";
import categoryController from "./modules/categories/categories.controller";
import supplierController from "./modules/suppliers/suppliers.controller";
import uploadsController from "./modules/uploads/uploads.controller";

import purchaseReturnsController from "./modules/purchase-returns/purchase-returns.controller";

import purchaseController from "./modules/purchases/purchases.controller";
import salesController from "./modules/sales/sales.controller";
import notificationsController from "./modules/notifications/notifications.controller";
import { customersController } from "./modules/customers/customers.controller";
import { defectiveItemsController } from "./modules/defective-items/defective-items.controller";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// Serve static files
app.use("/uploads/*", serveStatic({ root: "./public" }));

app.route("/auth", authController);
app.route("/inventory", inventoryController);
app.route("/categories", categoryController);
// app.route("/service", service);
app.route("/suppliers", supplierController);
app.route("/purchases", purchaseController);
app.route("/purchase-returns", purchaseReturnsController);
app.route("/sales", salesController);
app.route("/notifications", notificationsController);
app.route("/uploads", uploadsController);
app.route("/customers", customersController);
app.route("/defective-items", defectiveItemsController);

app.get("/", (c) => {
    return c.json({ message: "Saint Heavens Backend API is Running!" });
});

app.get("/health", async (c) => {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        return c.json({ status: "ok", db_users: result[0].count });
    } catch (e) {
        return c.json({ status: "error", message: String(e) }, 500);
    }
});

export default {
    port: 4000,
    fetch: app.fetch,
};

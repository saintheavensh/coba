import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createBunWebSocket } from "hono/bun";
import { db } from "./db";
import { users } from "./db/schema";
import { sql } from "drizzle-orm";
import { addClient, removeClient, getConnectionStats } from "./lib/websocket";
import { Logger } from "./lib/logger";

// Import Redis to initialize connections
import "./lib/redis";

import authController from "./modules/auth/auth.controller";
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
import serviceController from "./modules/service/service.controller";
import reportsController from "./modules/reports/reports.controller";
import { settingsController } from "./modules/settings/settings.controller";
import { paymentMethodsController } from "./modules/payment-methods/payment-methods.controller";
import dashboardController from "./modules/dashboard/dashboard.controller";
import usersController from "./modules/users/users.controller";
import devicesController from "./modules/devices/devices.controller";
import { brandsController } from "./modules/brands/brands.controller";

// Create WebSocket upgrader for Bun
const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// Serve static files
app.use("/uploads/*", serveStatic({ root: "./public" }));

// Routes
app.route("/auth", authController);
app.route("/inventory", inventoryController);
app.route("/categories", categoryController);
app.route("/service", serviceController);
app.route("/suppliers", supplierController);
app.route("/purchases", purchaseController);
app.route("/purchase-returns", purchaseReturnsController);
app.route("/sales", salesController);
app.route("/notifications", notificationsController);
app.route("/uploads", uploadsController);
app.route("/users", usersController);
app.route("/customers", customersController);
app.route("/defective-items", defectiveItemsController);
app.route("/reports", reportsController);
app.route("/settings", settingsController);
app.route("/payment-methods", paymentMethodsController);
app.route("/dashboard", dashboardController);
app.route("/devices", devicesController);
app.route("/brands", brandsController);

// WebSocket endpoint for real-time updates
app.get(
    "/ws",
    upgradeWebSocket((c) => {
        // Get user ID from query param (optional, for user-specific notifications)
        const userId = c.req.query("userId") || null;

        return {
            onOpen(event, ws) {
                Logger.info(`🔌 WebSocket opened${userId ? ` for user: ${userId}` : ""}`);
                addClient(userId, ws);
            },
            onMessage(event, ws) {
                // Handle incoming messages if needed
                const message = event.data.toString();
                Logger.info("📨 WebSocket message:", { message });

                // Echo back for now (can be extended for client commands)
                ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
            },
            onClose(event, ws) {
                Logger.info("🔌 WebSocket closed");
                removeClient(userId, ws);
            },
            onError(event, ws) {
                Logger.error("WebSocket error:", event);
                removeClient(userId, ws);
            },
        };
    })
);

// Root endpoint
app.get("/", (c) => {
    return c.json({ message: "Saint Heavens Backend API is Running!" });
});

// Health check endpoint
app.get("/health", async (c) => {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        const wsStats = getConnectionStats();
        return c.json({
            status: "ok",
            database: "postgresql",
            db_users: result[0].count,
            websocket: wsStats,
        });
    } catch (e) {
        return c.json({ status: "error", message: String(e) }, 500);
    }
});

// WebSocket stats endpoint
app.get("/ws/stats", (c) => {
    return c.json(getConnectionStats());
});

const port = parseInt(process.env.PORT || "4000");
const hostname = process.env.HOST || "0.0.0.0";

if (!process.env.JWT_SECRET) {
    Logger.warn("⚠️  JWT_SECRET is not set! Using default 'supersecret'. This is insecure for production.");
}

Logger.info(`🚀 Server starting on http://${hostname}:${port}`);

export default {
    port,
    hostname,
    fetch: app.fetch,
    websocket,
};

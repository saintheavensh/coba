import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import { users } from "./db/schema";
import { sql } from "drizzle-orm";
import { Logger } from "./lib/logger";
import { rateLimiterMiddleware } from "./middlewares/rate-limiter.middleware";
import { secureHeadersMiddleware } from "./middlewares/secure-headers.middleware";

import authController from "./modules/auth/routes/auth.routes";
import inventoryController from "./modules/inventory/routes/inventory.routes";
import categoryController from "./modules/categories/routes/categories.routes";
import supplierController from "./modules/suppliers/routes/suppliers.routes";
import uploadsController from "./modules/uploads/routes/uploads.routes";
import purchaseReturnsController from "./modules/purchase-returns/routes/purchase-returns.routes";
import purchaseController from "./modules/purchases/routes/purchases.routes";
import salesController from "./modules/sales/routes/sales.routes";
import notificationsController from "./modules/notifications/routes/notifications.routes";
import customersController from "./modules/customers/routes/customers.routes";
import defectiveItemsController from "./modules/defective-items/routes/defective-items.routes";
import serviceController from "./modules/service/routes/service.routes";
import reportsController from "./modules/reports/routes/reports.routes";
import settingsController from "./modules/settings/routes/settings.routes";
import paymentMethodsController from "./modules/payment-methods/routes/payment-methods.routes";
import dashboardController from "./modules/dashboard/routes/dashboard.routes";
import usersController from "./modules/users/routes/users.routes";
import devicesController from "./modules/devices/routes/devices.routes";
import brandsController from "./modules/brands/routes/brands.routes";
import serviceToolsController from "./modules/service-tools/routes/service-tools.routes";
import operationalCostsController from "./modules/operational-costs/routes/operational-costs.routes";
import accountingController from "./modules/accounting/routes/accounting.routes";
import whatsappController from "./modules/whatsapp/routes/whatsapp.routes";

export const app = new Hono();

// CORS configuration - allow credentials for cookie-based auth
app.use("*", cors({
    origin: (origin) => {
        // Allow all origins in development (including HTTPS frontend proxying to HTTP backend)
        if (process.env.NODE_ENV !== "production") {
            return origin || "*";
        }
        // In production, check against allowed origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
        if (origin && allowedOrigins.includes(origin)) {
            return origin;
        }
        return allowedOrigins[0] || null; // Return specific origin or null if not allowed
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
app.use("*", logger());
app.use("*", rateLimiterMiddleware);
// Secure headers
app.use("*", secureHeadersMiddleware);

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
app.route("/service-tools", serviceToolsController);
app.route("/operational-costs", operationalCostsController);
app.route("/accounting", accountingController);
app.route("/whatsapp", whatsappController);


// Root endpoint
app.get("/", (c) => {
    return c.json({ message: "Saint Heavens Backend API is Running!" });
});

// Health check endpoint
app.get("/health", async (c) => {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        return c.json({
            status: "ok",
            database: "postgresql",
            db_users: result[0].count,
            realtime: "supabase"
        });
    } catch (e) {
        return c.json({ status: "error", message: String(e) }, 500);
    }
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
};

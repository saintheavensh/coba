import { serveStatic } from "hono/bun";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { db } from "./db";
import { users } from "./db/schema";
import { sql } from "drizzle-orm";
import { appConfig } from "./shared/infrastructure/config/AppConfig";
import { Logger } from "./shared/utils/logger/Logger";
import { rateLimiterMiddleware } from "./middlewares/rate-limiter.middleware";
import { secureHeadersMiddleware } from "./middlewares/secure-headers.middleware";
import { swaggerApp, openApiConfig } from "./shared/presentation/docs/swagger";

import authController from "./shared/infrastructure/auth/presentation/routes/AuthRoutes";
import inventoryController from "./modules/inventory/presentation/inventory.routes";
import productsController from "./modules/products/presentation/products.routes";
import categoryController from "./modules/categories/presentation/categories.routes";
import { suppliersRoutes } from "./modules/suppliers/presentation";
import uploadsController from "./shared/infrastructure/storage/presentation/routes/StorageRoutes";
import purchaseReturnsController from "./modules/purchase-returns/presentation/purchase-returns.routes";
import { purchasesRoutes } from "./modules/purchases/presentation";
import salesController from "./modules/sales/presentation/sales.routes";
import messagingRoutes from "./shared/infrastructure/messaging/presentation/routes/MessagingRoutes";
import customersController from "./modules/customers/presentation/customers.routes";
import defectiveItemsController from "./modules/defective-items/presentation/defective-items.routes";
import serviceController from "./modules/service/presentation/service.routes";
import serviceCategoriesController from "./modules/service/presentation/category.routes";
import serviceTypesController from "./modules/service/presentation/type.routes";
import serviceItemsController from "./modules/service/presentation/items.routes";
import commissionRoutes from "./modules/service/presentation/commissions.routes";
import reportsController from "./modules/reports/presentation/reports.routes";
import approvalsController from "./modules/approvals/presentation/approval.controller";
import settingsRoutes from "./modules/settings/presentation/settings.routes";
import paymentMethodsController from "./modules/payment-methods/presentation/payment-methods.routes";
import dashboardController from "./modules/dashboard/presentation/dashboard.routes";
import usersController from "./modules/users/presentation/users.routes";
import { devicesRoutes } from "./modules/devices/presentation";
import { brandRoutes } from "./modules/brands/presentation";
import { storeDevicesRoutes } from "./shared/infrastructure/external-api/devices";
import serviceTools from "./modules/service-tools/presentation/service-tools.routes";
import operationalCostsController from "./modules/operational-costs/presentation/operational-costs.routes";
import accountingController from "./modules/accounting/presentation/accounting.routes";
import { dashboardRoutes } from "./shared/presentation/dashboard/routes/dashboard.routes";
// import whatsappController removed

export const app = new OpenAPIHono();

// Configure OpenAPI Spec
app.doc('/api-docs/spec', openApiConfig as any);

// Register Security Scheme globally
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
});

// CORS configuration - allow credentials for cookie-based auth
app.use("*", cors({
    origin: (origin) => {
        // Allow all origins in development (including HTTPS frontend proxying to HTTP backend)
        if (appConfig.isDevelopment) {
            return origin || "*";
        }
        // In production, check against allowed origins
        const allowedOrigins = appConfig.allowedOrigins;
        if (origin && allowedOrigins.includes(origin)) {
            return origin;
        }
        return allowedOrigins[0] || null; // Return specific origin or null if not allowed
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
import { loggerMiddleware } from "./shared/application/middlewares/LoggerMiddleware";
const globalLogger = new Logger('App');
app.use("*", loggerMiddleware);
app.use("*", rateLimiterMiddleware);
// Secure headers
app.use("*", secureHeadersMiddleware);

// Serve static files
app.use("/uploads/*", serveStatic({ root: "./public" }));

// Swagger UI
app.route("/api-docs", swaggerApp);

// Routes
app.route("/auth", authController);
app.route("/products", productsController);
app.route("/inventory", inventoryController);
app.route("/categories", categoryController);
app.route("/service", serviceController);
app.route("/service-categories", serviceCategoriesController);
app.route("/service-types", serviceTypesController);
app.route("/service-items", serviceItemsController);
app.route("/commissions", commissionRoutes);
app.route("/suppliers", suppliersRoutes);
app.route("/purchases", purchasesRoutes);
app.route("/purchase-returns", purchaseReturnsController);
app.route("/sales", salesController);
app.route("/notifications", messagingRoutes);
app.route("/uploads", uploadsController);
app.route("/users", usersController);
app.route("/customers", customersController);
app.route("/defective-items", defectiveItemsController);
app.route("/reports", reportsController);
app.route("/approvals", approvalsController);
app.route("/settings", settingsRoutes);
app.route("/payment-methods", paymentMethodsController);
app.route("/payments/methods", paymentMethodsController); // Alias for frontend
app.route("/dashboard", dashboardController);
app.route("/api/dashboard", dashboardRoutes);
app.route("/devices", devicesRoutes);
app.route("/brands", brandRoutes);
app.route("/service-tools", serviceTools);
app.route("/operational-costs", operationalCostsController);
app.route("/accounting", accountingController);
app.route("/store-devices", storeDevicesRoutes);
app.route("/whatsapp", messagingRoutes);


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

// Error handler
app.onError((err, c) => {
    const requestId = (c.get as any)('requestId');
    globalLogger.child({ requestId }).error('Unhandled error', err);
    return c.json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    }, 500);
});

// Not found handler
app.notFound((c) => {
    const requestId = (c.get as any)('requestId');
    globalLogger.child({ requestId }).warn('Route not found', { path: c.req.path });
    return c.json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${c.req.method} ${c.req.path} not found`
        }
    }, 404);
});

const port = appConfig.port;
const hostname = appConfig.host;

globalLogger.info(`🚀 Server starting on http://${hostname}:${port}`);

export default {
    port,
    hostname,
    fetch: app.fetch,
};

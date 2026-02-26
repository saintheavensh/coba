import { Hono } from "hono";
import { inventoryService } from "../inventory-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

const app = new Hono();

// List all dead phones
app.get("/dead-phones", async (c) => {
    try {
        const list = await inventoryService.getDeadPhones();
        return apiSuccess(c, list, "Dead phones retrieved successfully");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve dead phones");
    }
});

// Record a new dead phone purchase
app.post("/dead-phones", async (c) => {
    try {
        const body = await c.req.json();
        const result = await inventoryService.recordDeadPhonePurchase(body);
        return apiSuccess(c, result, "Dead phone purchase recorded", 201);
    } catch (e: any) {
        return apiError(c, e, "Failed to record dead phone purchase");
    }
});

// Record a test log for a dead phone
app.post("/test-logs", async (c) => {
    try {
        const body = await c.req.json();
        const result = await inventoryService.recordTestLog(body);
        return apiSuccess(c, result, "Test log recorded", 201);
    } catch (e: any) {
        return apiError(c, e, "Failed to record test log");
    }
});

export default app;

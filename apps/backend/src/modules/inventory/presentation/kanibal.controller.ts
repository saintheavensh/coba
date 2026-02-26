import { Hono } from "hono";
import { inventoryService } from "../inventory-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

const app = new Hono();

// List forfeited devices
app.get("/forfeited-devices", async (c) => {
    try {
        const list = await inventoryService.getForfeitedDevices();
        return apiSuccess(c, list, "Forfeited devices retrieved successfully");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve forfeited devices");
    }
});

// Forfeit a device from a service
app.post("/forfeit", async (c) => {
    try {
        const body = await c.req.json();
        const result = await inventoryService.forfeitServiceDevice(body);
        return apiSuccess(c, result, "Device forfeited successfully", 201);
    } catch (e: any) {
        return apiError(c, e, "Failed to forfeit device");
    }
});

// Harvest a part from a device
app.post("/harvest", async (c) => {
    try {
        const body = await c.req.json();
        const result = await inventoryService.harvestPart(body);
        return apiSuccess(c, result, "Part harvested successfully", 201);
    } catch (e: any) {
        return apiError(c, e, "Failed to harvest part");
    }
});

export default app;

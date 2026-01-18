import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { DevicesService } from "./devices.service";
import { apiResponse, apiSuccess } from "../../lib/response";
import { permissionGuard } from "../../middlewares/permission.middleware";

const app = new Hono();

const deviceSchema = z.object({
    brand: z.string().min(1),
    model: z.string().min(1),
    code: z.string().optional(),
    image: z.string().optional(),
});

app.get("/", async (c) => {
    const search = c.req.query("search");
    const data = await DevicesService.getAll(search);
    return apiSuccess(c, data, "Devices retrieved", 200);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const data = await DevicesService.getById(id);
    if (!data) return apiResponse(c, 404, "Device not found");
    return apiSuccess(c, data, "Device details", 200);
});

app.post(
    "/",
    permissionGuard("inventory.manage"), // Assume generalized permission for now
    zValidator("json", deviceSchema),
    async (c) => {
        const body = c.req.valid("json");
        // Cast or simplified object since Service handles ID generation
        const data = await DevicesService.create({
            brand: body.brand,
            model: body.model,
            code: body.code || undefined,
            image: body.image || undefined,
        });
        return apiSuccess(c, data, "Device created", 201);
    }
);

app.patch(
    "/:id",
    permissionGuard("inventory.manage"),
    zValidator("json", deviceSchema.partial()),
    async (c) => {
        const id = c.req.param("id");
        const body = c.req.valid("json");
        const data = await DevicesService.update(id, body);
        if (!data) return apiResponse(c, 404, "Device not found");
        return apiSuccess(c, data, "Device updated", 200);
    }
);

app.delete("/:id", permissionGuard("inventory.manage"), async (c) => {
    const id = c.req.param("id");
    const data = await DevicesService.delete(id);
    if (!data) return apiResponse(c, 404, "Device not found");
    return apiSuccess(c, data, "Device deleted", 200);
});

export default app;

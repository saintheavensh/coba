import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { DevicesService } from "./devices.service";
import { ScraperService } from "./scraper.service";
import { apiResponse, apiSuccess, apiError } from "../../lib/response";
import { permissionGuard } from "../../middlewares/permission.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();

const deviceSchema = z.object({
    brand: z.string().min(1),
    series: z.string().optional(),
    model: z.string().min(1),
    code: z.string().optional(),
    image: z.string().optional(),
    colors: z.array(z.string()).optional(),
    specs: z.string().optional(),
    chipset: z.string().optional(),
    specifications: z.record(z.any()).optional(),
});

app.post(
    "/scrape",
    authMiddleware,
    permissionGuard("inventory.manage"),
    async (c) => {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const data = await ScraperService.scrapeGsmArena(body.url);
            return apiSuccess(c, data, "Device data scraped successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to scrape data", 500);
        }
    }
);

app.post(
    "/scrape-list",
    authMiddleware,
    permissionGuard("inventory.manage"),
    async (c) => {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const links = await ScraperService.getDeviceLinks(body.url);
            return apiSuccess(c, links, "List parsed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to parse list", 500);
        }
    }
);

app.post(
    "/import-url",
    authMiddleware,
    permissionGuard("inventory.manage"),
    async (c) => {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            // 1. Scrape
            const scraped = await ScraperService.scrapeGsmArena(body.url);

            // 2. Create in DB
            const data = await DevicesService.create({
                brand: scraped.brand,
                model: scraped.model,
                image: scraped.image,
                code: scraped.code,
                specs: scraped.specs_ram_storage,
                chipset: scraped.chipset,
                // @ts-ignore
                specifications: scraped.specifications,
                colors: scraped.specifications.colors ? scraped.specifications.colors.split(",").map((s: string) => s.trim()) : []
            });

            return apiSuccess(c, data, "Device imported successfully");
        } catch (e: any) {
            // Return 200 with error info so frontend bulk process continues
            return apiSuccess(c, { error: e.message, success: false }, "Failed to import", 200);
        }
    }
);



app.get("/", async (c) => {
    const search = c.req.query("search");
    const brand = c.req.query("brand");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const data = await DevicesService.getAll(search, limit, offset, brand);
    return apiSuccess(c, data, "Devices retrieved", 200);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const data = await DevicesService.getById(id);
    if (!data) return apiError(c, null, "Device not found", 404);
    return apiSuccess(c, data, "Device details", 200);
});

app.post(
    "/",
    authMiddleware,
    permissionGuard("inventory.manage"), // Assume generalized permission for now
    zValidator("json", deviceSchema),
    async (c) => {
        const body = c.req.valid("json");
        // Cast or simplified object since Service handles ID generation
        const data = await DevicesService.create({
            brand: body.brand,
            series: body.series || undefined,
            model: body.model,
            code: body.code || undefined,
            image: body.image || undefined,
            colors: body.colors || undefined,
            specs: body.specs || undefined,
            chipset: body.chipset || undefined,
            specifications: body.specifications || undefined,
        });
        return apiSuccess(c, data, "Device created", 201);
    }
);

app.patch(
    "/:id",
    authMiddleware,
    permissionGuard("inventory.manage"),
    zValidator("json", deviceSchema.partial()),
    async (c) => {
        const id = c.req.param("id");
        const body = c.req.valid("json");
        const data = await DevicesService.update(id, body);
        if (!data) return apiError(c, null, "Device not found", 404);
        return apiSuccess(c, data, "Device updated", 200);
    }
);

app.post(
    "/bulk-delete",
    authMiddleware,
    permissionGuard("inventory.manage"),
    async (c) => {
        const body = await c.req.json();
        if (!body.ids || !Array.isArray(body.ids)) {
            return apiError(c, null, "IDs must be an array", 400);
        }
        const data = await DevicesService.bulkDelete(body.ids);
        return apiSuccess(c, data, "Devices deleted", 200);
    }
);

app.delete("/:id", authMiddleware, permissionGuard("inventory.manage"), async (c) => {
    const id = c.req.param("id");
    const data = await DevicesService.delete(id);
    if (!data) return apiError(c, null, "Device not found", 404);
    return apiSuccess(c, data, "Device deleted", 200);
});

export default app;

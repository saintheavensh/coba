import { Context } from "hono";
import { DevicesService } from "../services/devices.service";
import { ScraperService } from "../services/scraper.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class DevicesController {
    async scrape(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const data = await ScraperService.scrapeGsmArena(body.url);
            return apiSuccess(c, data, "Device data scraped successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to scrape data", 500);
        }
    }

    async scrapeList(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.url) return apiError(c, "URL is required", "Missing URL", 400);

            const links = await ScraperService.getDeviceLinks(body.url);
            return apiSuccess(c, links, "List parsed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to parse list", 500);
        }
    }

    async importUrl(c: Context) {
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
                colors: scraped.specifications?.colors?.split(",").map((s: string) => s.trim()) || []
            });

            return apiSuccess(c, data, "Device imported successfully");
        } catch (e: any) {
            return apiSuccess(c, { error: e.message, success: false }, "Failed to import", 200);
        }
    }

    async getAll(c: Context) {
        const search = c.req.query("search");
        const brand = c.req.query("brand");
        const limit = parseInt(c.req.query("limit") || "20");
        const offset = parseInt(c.req.query("offset") || "0");
        const data = await DevicesService.getAll(search, limit, offset, brand);
        return apiSuccess(c, data, "Devices retrieved", 200);
    }

    async getById(c: Context) {
        const id = c.req.param("id");
        const data = await DevicesService.getById(id);
        if (!data) return apiError(c, null, "Device not found", 404);
        return apiSuccess(c, data, "Device details", 200);
    }

    async create(c: Context) {
        const body = (c.req as any).valid("json");
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

    async update(c: Context) {
        const id = c.req.param("id");
        const body = (c.req as any).valid("json");
        const data = await DevicesService.update(id, body);
        if (!data) return apiError(c, null, "Device not found", 404);
        return apiSuccess(c, data, "Device updated", 200);
    }

    async bulkDelete(c: Context) {
        const body = await c.req.json();
        if (!body.ids || !Array.isArray(body.ids)) {
            return apiError(c, null, "IDs must be an array", 400);
        }
        const data = await DevicesService.bulkDelete(body.ids);
        return apiSuccess(c, data, "Devices deleted", 200);
    }

    async delete(c: Context) {
        const id = c.req.param("id");
        const data = await DevicesService.delete(id);
        if (!data) return apiError(c, null, "Device not found", 404);
        return apiSuccess(c, data, "Device deleted", 200);
    }
}

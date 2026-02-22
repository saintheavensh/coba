import { Context } from "hono";
import { DevicesService } from "../services/devices.service";
import { ScraperService } from "../services/scraper.service";
import { apiSuccess, apiError } from "../../../lib/response";

export class DevicesController {
    private service: DevicesService;

    constructor(service?: DevicesService) {
        this.service = service || new DevicesService();
    }

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
            const data = await this.service.create({
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
        try {
            const search = c.req.query("search");
            const brand = c.req.query("brand");
            const limit = parseInt(c.req.query("limit") || "20");
            const offset = parseInt(c.req.query("offset") || "0");
            const data = await this.service.getAll({ search, limit, offset, brand });
            return apiSuccess(c, data, "Devices retrieved", 200);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve devices", 500);
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await this.service.getById(id);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device details", 200);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve device", 500);
        }
    }

    async create(c: Context) {
        try {
            const body = (c.req as any).valid("json");
            const data = await this.service.create(body);
            return apiSuccess(c, data, "Device created", 201);
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to create device", 500);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const body = (c.req as any).valid("json");
            const data = await this.service.update(id, body);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device updated", 200);
        } catch (e: any) {
            if (e.message && e.message.includes("Validation") || e.name === "ZodError") {
                return apiError(c, e, "Validation failed", 400);
            }
            return apiError(c, e, "Failed to update device", 500);
        }
    }

    async bulkDelete(c: Context) {
        try {
            const body = await c.req.json();
            if (!body.ids || !Array.isArray(body.ids)) {
                return apiError(c, null, "IDs must be an array", 400);
            }
            const data = await this.service.bulkDelete(body.ids);
            return apiSuccess(c, data, "Devices deleted", 200);
        } catch (e) {
            return apiError(c, e, "Failed to delete devices", 500);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await this.service.delete(id);
            if (!data) return apiError(c, null, "Device not found", 404);
            return apiSuccess(c, data, "Device deleted", 200);
        } catch (e) {
            return apiError(c, e, "Failed to delete device", 500);
        }
    }

    async getUnlinked(c: Context) {
        try {
            const limit = parseInt(c.req.query("limit") || "50");
            const offset = parseInt(c.req.query("offset") || "0");
            const data = await this.service.getUnlinkedProducts(limit, offset);
            return apiSuccess(c, data, "Unlinked products retrieved", 200);
        } catch (e) {
            return apiError(c, e, "Failed to retrieve unlinked products", 500);
        }
    }

    async sync(c: Context) {
        try {
            const id = c.req.param("id");
            const result = await this.service.syncCompatibility(id);
            return apiSuccess(c, result, "Device compatibility synced", 200);
        } catch (e) {
            return apiError(c, e, "Failed to sync", 500);
        }
    }
}

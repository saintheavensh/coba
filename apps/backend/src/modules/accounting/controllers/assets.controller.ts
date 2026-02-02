import { Context } from "hono";
import { AssetsService } from "../services/assets.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class AssetsController {
    static async getAll(c: Context) {
        try {
            const { category, status, limit, offset } = c.req.query();
            const assets = await AssetsService.getAll({
                category: category as any,
                status: status as any,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return c.json(assets);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const asset = await AssetsService.getById(id);
            if (!asset) return c.json({ error: "Asset not found" }, 404);
            return c.json(asset);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async create(c: Context) {
        try {
            const data = await c.req.json();
            const userId = getUserId(c);
            const id = await AssetsService.create(data, userId);
            return c.json({ id }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await c.req.json();
            const userId = getUserId(c);
            await AssetsService.update(id, data, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id");
            const userId = getUserId(c);
            await AssetsService.delete(id, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async processDepreciation(c: Context) {
        try {
            const { period } = await c.req.json();
            const userId = getUserId(c);
            const result = await AssetsService.processAllDepreciation(period, userId);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

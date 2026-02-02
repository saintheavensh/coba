import { Context } from "hono";
import { AuditService } from "../services/audit.service";

export class AuditController {
    static async getAll(c: Context) {
        try {
            const { startDate, endDate, userId, entityType, action, limit, offset } = c.req.query();
            const logs = await AuditService.getLogs({
                startDate,
                endDate,
                userId,
                entityType,
                action: action as any,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return c.json(logs);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getByEntity(c: Context) {
        try {
            const { entityType, entityId } = c.req.param();
            const logs = await AuditService.getByEntity(entityType, entityId);
            return c.json(logs);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

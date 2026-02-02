import { Context } from "hono";
import { PeriodCloseService } from "../services/period-close.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class PeriodCloseController {
    static async getAll(c: Context) {
        try {
            const periods = await PeriodCloseService.getAllPeriods();
            return c.json(periods);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getSummary(c: Context) {
        try {
            const period = c.req.param("period");
            const summary = await PeriodCloseService.getPeriodSummary(period);
            return c.json(summary);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async close(c: Context) {
        try {
            const period = c.req.param("period");
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);
            await PeriodCloseService.closePeriod(period, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async reopen(c: Context) {
        try {
            const period = c.req.param("period");
            const { reason } = await c.req.json();
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);
            await PeriodCloseService.reopenPeriod(period, reason, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

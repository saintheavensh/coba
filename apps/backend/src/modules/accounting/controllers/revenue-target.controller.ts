import { Context } from "hono";
import { RevenueTargetService } from "../services/revenue-target.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class RevenueTargetController {
    static async getToday(c: Context) {
        try {
            const progress = await RevenueTargetService.getTodayProgress();
            return c.json(progress);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getMonth(c: Context) {
        try {
            const month = c.req.param("month");
            const progress = await RevenueTargetService.getMonthProgress(month);
            return c.json(progress);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async setTarget(c: Context) {
        try {
            const month = c.req.param("month");
            const data = await c.req.json();
            const userId = getUserId(c);
            await RevenueTargetService.calculateAndSet({ month, ...data }, userId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

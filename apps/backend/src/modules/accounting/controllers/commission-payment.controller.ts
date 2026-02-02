import { Context } from "hono";
import { CommissionPaymentService } from "../services/commission-payment.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class CommissionPaymentController {
    static async getPending(c: Context) {
        try {
            const period = c.req.param("period");
            const pending = await CommissionPaymentService.getPendingCommissions(period);
            return c.json(pending);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getSummary(c: Context) {
        try {
            const period = c.req.param("period");
            const summary = await CommissionPaymentService.getPeriodSummary(period);
            return c.json(summary);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getHistory(c: Context) {
        try {
            const { technicianId, period } = c.req.query();
            const history = await CommissionPaymentService.getPaymentHistory(technicianId, period);
            return c.json(history);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async pay(c: Context) {
        try {
            const data = await c.req.json();
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);
            const id = await CommissionPaymentService.payCommission(data, userId);
            return c.json({ id }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

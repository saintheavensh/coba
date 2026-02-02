import { Context } from "hono";
import { CashRegisterService } from "../services/cash-register.service";
import { RevenueTargetService } from "../services/revenue-target.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class CashRegisterController {
    static async getCurrent(c: Context) {
        try {
            const register = await CashRegisterService.getCurrentRegister();
            return c.json(register);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getStatus(c: Context) {
        try {
            const [status, progress] = await Promise.all([
                CashRegisterService.getTodayProgress(),
                RevenueTargetService.getTodayProgress(),
            ]);
            return c.json({
                ...status,
                dailyBreakeven: progress.dailyBreakeven || 0
            });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async open(c: Context) {
        try {
            const { openingBalance } = await c.req.json();
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);
            const id = await CashRegisterService.open(openingBalance, userId);
            return c.json({ id }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async close(c: Context) {
        try {
            const { actualClosing, notes, reserveAmount, targetAccountId } = await c.req.json();
            const userId = getUserId(c);
            if (!userId) return c.json({ error: "Unauthorized" }, 401);

            const result = await CashRegisterService.close(
                actualClosing,
                notes,
                userId,
                reserveAmount && targetAccountId ? { amount: reserveAmount, targetAccountId } : undefined
            );
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getHistory(c: Context) {
        try {
            const { startDate, endDate, limit } = c.req.query();
            const history = await CashRegisterService.getHistory(startDate, endDate, limit ? parseInt(limit) : undefined);
            return c.json(history);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

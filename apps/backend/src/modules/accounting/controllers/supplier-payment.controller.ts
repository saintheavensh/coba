import { Context } from "hono";
import { SupplierPaymentService } from "../services/supplier-payment.service";

// Helper to extract user ID from JWT payload
function getUserId(c: any): string | undefined {
    const payload = c.get("jwtPayload") as any;
    return payload?.id || payload?.userId || payload?.sub;
}

export class SupplierPaymentController {
    static async getPayables(c: Context) {
        try {
            const payables = await SupplierPaymentService.getOutstandingPayables();
            return c.json(payables);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async getSummary(c: Context) {
        try {
            const summary = await SupplierPaymentService.getPayablesSummary();
            return c.json(summary);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }

    static async pay(c: Context) {
        try {
            const data = await c.req.json();
            const userId = getUserId(c);
            const id = await SupplierPaymentService.create(data, userId);
            return c.json({ id }, 201);
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

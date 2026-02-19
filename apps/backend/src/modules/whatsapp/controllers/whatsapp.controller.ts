import { Context } from "hono";
import { WhatsAppService } from "../services/whatsapp.service";
import { apiError, apiSuccess } from "../../../lib/response";

const service = new WhatsAppService();

export class WhatsAppController {
    static async sendMessage(c: Context) {
        try {
            const body = await c.req.json<{ to: string; message: string }>();

            if (!body.to || !body.message) {
                return c.json({ success: false, message: "Missing 'to' or 'message' field" }, 400);
            }

            const result = await service.sendMessage(body.to, body.message);

            if (result.success) {
                return apiSuccess(c, { message: result.message });
            } else {
                return apiError(c, result.error, "Failed to send WhatsApp message");
            }
        } catch (e: any) {
            return apiError(c, e, "Internal Server Error");
        }
    }
}

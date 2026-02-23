import { IWhatsAppGateway } from "../domain/repositories/whatsapp-gateway.port";
import { WhatsAppResponse } from "../domain/entities/whatsapp.entity";
import { Logger } from "../../../lib/logger";

export class WhatsAppGatewayAdapter implements IWhatsAppGateway {
    async send(to: string, message: string, gatewayUrl: string, apiKey: string): Promise<WhatsAppResponse> {
        try {
            Logger.info(`[WhatsApp] Sending to ${to} via ${gatewayUrl}`);

            const payload = {
                target: to,
                to: to,
                number: to,
                message: message,
            };

            const response = await fetch(gatewayUrl, {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();

            if (!response.ok) {
                Logger.error(`[WhatsApp] Gateway Error: ${response.status} - ${responseText}`);
                return { success: false, error: `Gateway connection failed: ${response.statusText}` };
            }

            Logger.info(`[WhatsApp] Gateway Response: ${responseText}`);
            return { success: true, message: "Message sent to gateway" };

        } catch (e: any) {
            Logger.error(`[WhatsApp] Exception: ${e.message}`);
            return { success: false, error: e.message };
        }
    }
}

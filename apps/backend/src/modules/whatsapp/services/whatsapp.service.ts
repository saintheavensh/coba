import { SettingsService } from "../../settings/services/settings.service";
import { Logger } from "../../../lib/logger";

const settingsService = new SettingsService();

export class WhatsAppService {
    /**
     * Sends a WhatsApp message using the configured Server-Side Gateway.
     * @param to Destination number (e.g. "628123456789")
     * @param message Message content
     */
    async sendMessage(to: string, message: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const settings = await settingsService.getWhatsAppSettings();

            if (!settings.enabled) {
                return { success: false, error: "WhatsApp integration is disabled in settings." };
            }

            if (settings.mode !== "server") {
                return { success: false, error: "System is configured for Client-Side mode. Cannot send from server." };
            }

            if (!settings.gatewayUrl || !settings.apiKey) {
                return { success: false, error: "Gateway URL or API Key is missing in settings." };
            }

            // Clean number (ensure no + or spaces, generic logic)
            // Most gateways expect 628... or 08... depending on provider.
            // Let's assume standard international format without +
            let cleanTo = to.replace(/[^0-9]/g, "");
            if (cleanTo.startsWith("0")) {
                cleanTo = "62" + cleanTo.slice(1);
            }

            Logger.info(`[WhatsApp] Sending to ${cleanTo} via ${settings.gatewayUrl}`);

            // Generic POST request structure used by most gateways (Fonnte, Wabus, etc.)
            // Usually: { target: string, message: string } or similar.
            // Since we want to be generic, we might need a standard payload.
            // But for now, let's implement a standard JSON payload that most support or we adapt.
            // Common standard for Fonnte: { target: '08...', message: '...' }
            // Let's assume the user will configure a compatible gateway or we might need to make this adaptable later.
            // For this implementation, I will send a standard JSON payload.

            const payload = {
                target: cleanTo,
                to: cleanTo, // Redundant compatibility
                number: cleanTo, // Redundant compatibility
                message: message,
            };

            const response = await fetch(settings.gatewayUrl, {
                method: "POST",
                headers: {
                    "Authorization": settings.apiKey,
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

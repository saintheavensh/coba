import { WhatsAppGatewayAdapter } from "./infrastructure/whatsapp-gateway.adapter";
import { SendWhatsAppMessageUseCase, ISettingsServiceFacade } from "./application/use-cases/send-whatsapp-message.use-case";
import { settingsService } from "../settings/settings-container";
import { DEFAULT_WHATSAPP_SETTINGS } from "../settings/application/constants";

/**
 * Adapter to bridge between Settings module and WhatsApp module expectations.
 */
class SettingsServiceFacadeAdapter implements ISettingsServiceFacade {
    async getWhatsAppSettings() {
        return await settingsService.get("whatsapp_settings", DEFAULT_WHATSAPP_SETTINGS);
    }
}

// Adapters
const whatsappGateway = new WhatsAppGatewayAdapter();
const settingsFacade = new SettingsServiceFacadeAdapter();

// Use Cases
const sendWhatsAppMessageUC = new SendWhatsAppMessageUseCase(whatsappGateway, settingsFacade);

export {
    sendWhatsAppMessageUC
};

import { IWhatsAppGateway } from "../../domain/repositories/whatsapp-gateway.port";
import { WhatsAppResponse } from "../../domain/entities/whatsapp.entity";

export interface ISettingsServiceFacade {
    getWhatsAppSettings(): Promise<any>;
}

export class SendWhatsAppMessageUseCase {
    constructor(
        private readonly gateway: IWhatsAppGateway,
        private readonly settingsService: ISettingsServiceFacade
    ) { }

    async execute(to: string, message: string): Promise<WhatsAppResponse> {
        const settings = await this.settingsService.getWhatsAppSettings();

        if (!settings.enabled) {
            return { success: false, error: "WhatsApp integration is disabled in settings." };
        }

        if (settings.mode !== "server") {
            return { success: false, error: "System is configured for Client-Side mode. Cannot send from server." };
        }

        if (!settings.gatewayUrl || !settings.apiKey) {
            return { success: false, error: "Gateway URL or API Key is missing in settings." };
        }

        // Clean number logic
        let cleanTo = to.replace(/[^0-9]/g, "");
        if (cleanTo.startsWith("0")) {
            cleanTo = "62" + cleanTo.slice(1);
        }

        return await this.gateway.send(cleanTo, message, settings.gatewayUrl, settings.apiKey);
    }
}

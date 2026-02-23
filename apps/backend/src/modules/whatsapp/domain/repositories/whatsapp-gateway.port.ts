import { WhatsAppResponse } from "../entities/whatsapp.entity";

export interface IWhatsAppGateway {
    send(to: string, message: string, gatewayUrl: string, apiKey: string): Promise<WhatsAppResponse>;
}

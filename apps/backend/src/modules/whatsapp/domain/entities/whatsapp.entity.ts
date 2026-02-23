export interface WhatsAppMessage {
    to: string;
    message: string;
}

export interface WhatsAppResponse {
    success: boolean;
    message?: string;
    error?: string;
}

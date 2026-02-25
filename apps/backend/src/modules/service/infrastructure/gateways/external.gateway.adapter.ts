import { DBContext } from "../../../../shared/types/db-context";
import { NotificationService } from "../../../../shared/infrastructure/messaging/NotificationService";
import { SettingsService } from "../../../settings/settings-container";
import { db } from "../../../../db";
import { users } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { Logger } from "../../../../shared/utils/logger/Logger";
import { INotificationGateway, ISettingsGateway, IUserGateway } from "../../domain";

export class NotificationGatewayAdapter implements INotificationGateway {
    async technicianAssigned(technicianId: string, serviceNo: string, serviceId: string): Promise<void> {
        try {
            await NotificationService.technicianAssigned(technicianId, serviceNo, serviceId);
        } catch (e) {
            new Logger("NotificationGateway").error("Failed to send technician assignment notification", e);
        }
    }

    async serviceStatusChanged(userId: string, serviceNo: string, status: string, serviceId: string): Promise<void> {
        try {
            await NotificationService.serviceStatusChanged(userId, serviceNo, status, serviceId);
        } catch (e) {
            new Logger("NotificationGateway").error("Failed to send cashier status update notification", e);
        }
    }

    async sendWhatsApp(type: "new" | "status" | "complete", serviceData: any, extra: any): Promise<void> {
        try {
            const settingsService = new SettingsService();
            const settings = await settingsService.getWhatsAppSettings();
            if (!settings.enabled) return;

            let shouldSend = false;
            let template = "";

            if (type === "new") {
                shouldSend = settings.autoSendOnNewService;
                template = settings.newServiceTemplate;
            } else if (type === "status") {
                shouldSend = settings.autoSendOnStatusChange;
                template = settings.statusUpdateTemplate;
            } else if (type === "complete") {
                shouldSend = settings.autoSendOnComplete;
                template = settings.readyForPickupTemplate;
            }

            if (!shouldSend || !template) return;

            const customerName = serviceData.customer?.name || "Customer";
            const customerPhone = serviceData.customer?.phone;
            if (!customerPhone) return;

            const serviceNo = serviceData.no;
            const deviceName = serviceData.device ? `${serviceData.device.brand} ${serviceData.device.model}` : "Device";
            const status = extra.status || serviceData.status;

            const statusMap: Record<string, string> = {
                "antrian": "Dalam Antrian",
                "dicek": "Sedang Dicek",
                "menunggu_sparepart": "Menunggu Sparepart",
                "konfirmasi": "Butuh Konfirmasi",
                "dikerjakan": "Sedang Dikerjakan",
                "re-konfirmasi": "Konfirmasi Ulang",
                "selesai": "Selesai",
                "diambil": "Sudah Diambil",
                "batal": "Dibatalkan"
            };
            const readableStatus = statusMap[status] || status;
            const total = new Intl.NumberFormat("id-ID").format(extra.total || serviceData.actualCost || 0);

            const message = template
                .replace(/{customer}/g, customerName)
                .replace(/{serviceNo}/g, serviceNo)
                .replace(/{device}/g, deviceName)
                .replace(/{status}/g, readableStatus)
                .replace(/{total}/g, total)
                .replace(/{days}/g, "0");

            new Logger("NotificationGateway").info(`[WHATSAPP] Sending to ${customerPhone}: ${message}`);
        } catch (e) {
            new Logger("NotificationGateway").error("[WHATSAPP] Failed to send notification", e);
        }
    }
}

export class SettingsGatewayAdapter implements ISettingsGateway {
    async getWarrantyDays(label: string, dbOrTx?: DBContext): Promise<number> {
        try {
            const settingsService = new SettingsService();
            const settings = await settingsService.getServiceSettings(dbOrTx as any);
            const preset = settings.warrantyPresets.find((p: any) => p.label === label);
            if (preset) return preset.days;
        } catch (e) {
            new Logger("SettingsGateway").error("Error fetching warranty settings", e);
        }
        return 0;
    }

    async getServiceSettings(dbOrTx?: DBContext): Promise<any> {
        const settingsService = new SettingsService();
        return await settingsService.getServiceSettings(dbOrTx as any);
    }
}

export class UserGatewayAdapter implements IUserGateway {
    async getTechnician(id: string, dbOrTx?: DBContext): Promise<any> {
        const client = (dbOrTx as any) || db;
        return await client.query.users.findFirst({
            where: eq(users.id, id)
        });
    }
}

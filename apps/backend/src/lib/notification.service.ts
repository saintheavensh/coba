import { publisher } from "./redis";
import { db } from "../db";
import { notifications } from "../db/schema";

type NotificationType = "low_stock" | "service_update" | "new_assignment" | "sale_complete" | "purchase_complete";

interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}

/**
 * Send a notification to a specific user
 * - Saves to database for persistence
 * - Publishes to Redis for real-time delivery via WebSocket
 */
export async function sendNotification(payload: NotificationPayload) {
    // Save to database
    const [notification] = await db.insert(notifications).values({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType,
        entityId: payload.entityId,
        isRead: false,
    }).returning();

    // Publish to Redis for real-time delivery
    await publisher.publish("notifications", JSON.stringify({
        ...notification,
        userId: payload.userId,
    }));

    return notification;
}

/**
 * Send notification to multiple users
 */
export async function broadcastNotification(
    payload: Omit<NotificationPayload, "userId">,
    userIds: string[]
) {
    const results = [];

    for (const userId of userIds) {
        const result = await sendNotification({ ...payload, userId });
        results.push(result);
    }

    return results;
}

/**
 * Publish a real-time update (without saving to database)
 * Useful for live data sync (e.g., stock updates, service status changes)
 */
export async function publishRealTimeUpdate(
    eventType: string,
    data: Record<string, unknown>
) {
    await publisher.publish("realtime", JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
    }));
}

/**
 * Common notification helpers
 */
export const NotificationService = {
    // Stock alerts
    async lowStock(userId: string, productName: string, currentStock: number, productId: string) {
        return sendNotification({
            userId,
            type: "low_stock",
            title: "Stok Rendah",
            message: `${productName} tersisa ${currentStock} unit`,
            entityType: "product",
            entityId: productId,
        });
    },

    // Service updates
    async serviceStatusChanged(userId: string, serviceNo: string, newStatus: string, serviceId: string) {
        return sendNotification({
            userId,
            type: "service_update",
            title: "Status Servis Berubah",
            message: `Servis ${serviceNo} sekarang: ${newStatus}`,
            entityType: "service",
            entityId: serviceId,
        });
    },

    // Technician assignment
    async technicianAssigned(technicianId: string, serviceNo: string, serviceId: string) {
        return sendNotification({
            userId: technicianId,
            type: "new_assignment",
            title: "Tugas Baru",
            message: `Anda ditugaskan untuk servis ${serviceNo}`,
            entityType: "service",
            entityId: serviceId,
        });
    },

    // Sale complete
    async saleCompleted(userId: string, saleId: string, amount: number) {
        return sendNotification({
            userId,
            type: "sale_complete",
            title: "Penjualan Selesai",
            message: `Transaksi ${saleId} senilai Rp ${amount.toLocaleString("id-ID")} berhasil`,
            entityType: "sale",
            entityId: saleId,
        });
    },

    // Purchase complete
    async purchaseCompleted(userId: string, purchaseId: string, supplierName: string) {
        return sendNotification({
            userId,
            type: "purchase_complete",
            title: "Pembelian Selesai",
            message: `Pembelian dari ${supplierName} (${purchaseId}) tercatat`,
            entityType: "purchase",
            entityId: purchaseId,
        });
    },

    // Real-time data sync helpers
    async syncStockUpdate(productId: string, newStock: number) {
        return publishRealTimeUpdate("stock_update", { productId, stock: newStock });
    },

    async syncServiceUpdate(serviceId: string, status: string) {
        return publishRealTimeUpdate("service_update", { serviceId, status });
    },
};

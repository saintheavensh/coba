import { writable } from "svelte/store";
import { WARRANTY_PRESETS } from "@repo/shared";

// Types
export interface StoreSettings {
    name: string;
    address: string;
    phone: string;
    receiptFooter: string;
    defaultWarrantyDays: number;
    gracePeriodDays: number;
    warrantyPresets: { label: string; days: number }[];
}

export interface ActivityLog {
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    details: string;
    type: "info" | "success" | "warning" | "error";
    isRead: boolean;
}

// Initial Settings
const initialSettings: StoreSettings = {
    name: "Saint Heavens Cell",
    address: "Jl. Raya Padjajaran No. 123, Bogor",
    phone: "0812-3456-7890",
    receiptFooter: "Terima kasih atas kepercayaan Anda!",
    defaultWarrantyDays: 30, // Default 30 days
    gracePeriodDays: 30, // Default 30 days
    warrantyPresets: WARRANTY_PRESETS
};

// Settings Store
function createSettingsStore() {
    const { subscribe, set, update } = writable<StoreSettings>(initialSettings);

    return {
        subscribe,
        updateSetting: (key: keyof StoreSettings, value: any) => {
            update(s => ({ ...s, [key]: value }));
        },
        reset: () => set(initialSettings)
    };
}

// Activity Log Store
function createActivityLogStore() {
    const { subscribe, update } = writable<ActivityLog[]>([]);

    return {
        subscribe,
        addLog: (user: string, action: string, details: string, type: ActivityLog["type"] = "info") => {
            const newLog: ActivityLog = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                user,
                action,
                details,
                type,
                isRead: false
            };
            update(logs => [newLog, ...logs]);
        },
        markAllAsRead: () => {
            update(logs => logs.map(l => ({ ...l, isRead: true })));
        },
        clear: () => update(() => [])
    };
}

import { wsClient } from "../websocket";
import { toast } from "../components/ui/sonner";

export const settings = createSettingsStore();
export const activityLogs = createActivityLogStore();

// Subscribe to WebSocket messages to update Activity Logs
if (typeof window !== "undefined") {
    wsClient.lastMessage.subscribe((msg: any) => {
        if (msg && msg.data) {
            const data = msg.data;
            let logType: ActivityLog["type"] = "info";
            let logUser = "System";

            // Map notification types to UI styles
            switch (data.type) {
                case "low_stock":
                    logType = "warning";
                    logUser = "Inventory";
                    break;
                case "new_assignment":
                case "sale_complete":
                    logType = "success";
                    logUser = data.type === "new_assignment" ? "Tugas" : "Kasir";
                    break;
                case "service_update":
                    logType = "info";
                    logUser = "Service";
                    break;
                case "purchase_complete":
                    logType = "info";
                    logUser = "Inventory";
                    break;
            }

            // Add to activity log store
            activityLogs.addLog(
                logUser,
                data.title || "Notification",
                data.message || "New activity detected",
                logType
            );

            // Trigger beautiful toast notifications
            const toastOptions = {
                description: data.message || "New activity detected",
            };

            if (logType === "success") {
                toast.success(data.title || "Success", toastOptions);
            } else if (logType === "warning") {
                toast.warning(data.title || "Warning", toastOptions);
            } else {
                toast.info(data.title || "Notification", toastOptions);
            }
        }
    });
}

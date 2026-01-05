import { writable } from "svelte/store";

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
    warrantyPresets: [
        { label: "Tidak Ada", days: 0 },
        { label: "Garansi 3 Hari (Cek Fisik)", days: 3 },
        { label: "Garansi 1 Minggu", days: 7 },
        { label: "Garansi 1 Bulan", days: 30 }
    ]
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

export const settings = createSettingsStore();
export const activityLogs = createActivityLogStore();

/**
 * Global Settings Store - Svelte 5 Runes
 * 
 * This store fetches settings from the API and provides reactive access
 * throughout the application. Use this for displaying store info on receipts,
 * applying service settings, etc.
 */

import { SettingsService, type AllSettings, type StoreInfo, type ReceiptSettings, type ServiceSettings, type WhatsAppSettings } from "$lib/services/settings.service";

// Default values (fallback if API fails)
const DEFAULT_STORE_INFO: StoreInfo = {
    name: "Toko Service",
    address: "",
    phone: "",
    email: "",
    logo: "",
    socialMedia: "",
};

const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
    showLogo: true,
    headerText: "",
    footerText: "Terima kasih atas kepercayaan Anda",
    termsConditions: "",
    showCustomerPhone: true,
    showCustomerAddress: false,
    showImei: false,
    showSparepartDetails: false,
    showTechnicianName: true,
    showWarrantyInfo: true,
    printerType: "thermal",
    paperSize: "58mm",
    printCopies: 1,
};

const DEFAULT_SERVICE_SETTINGS: ServiceSettings = {
    numberFormat: "SRV-{YYYY}-{XXX}",
    resetCounterYearly: true,
    defaultStatus: "antrian",
    autoNotifyOnStatusChange: false,
    warrantyPresets: [
        { label: "Tanpa Garansi", days: 0 },
        { label: "1 Minggu", days: 7 },
        { label: "1 Bulan", days: 30 },
    ],
    defaultWarrantyDays: 7,
    gracePeriodDays: 3,
    autoCloseAfterDays: 30,
    reminderBeforePickup: true,
    reminderDays: 7,
};

const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
    enabled: false,
    phoneNumber: "",
    newServiceTemplate: "",
    statusUpdateTemplate: "",
    readyForPickupTemplate: "",
    warrantyReminderTemplate: "",
    autoSendOnNewService: false,
    autoSendOnStatusChange: false,
    autoSendOnComplete: false,
};

// Create the store using Svelte 5 runes pattern
function createSettingsStore() {
    let storeInfo = $state<StoreInfo>(DEFAULT_STORE_INFO);
    let receiptSettings = $state<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
    let serviceSettings = $state<ServiceSettings>(DEFAULT_SERVICE_SETTINGS);
    let whatsappSettings = $state<WhatsAppSettings>(DEFAULT_WHATSAPP_SETTINGS);
    let isLoaded = $state(false);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    async function load() {
        if (isLoading) return;

        isLoading = true;
        error = null;

        try {
            const data = await SettingsService.getAll();

            storeInfo = {
                ...DEFAULT_STORE_INFO,
                ...data.storeInfo,
            };
            receiptSettings = {
                ...DEFAULT_RECEIPT_SETTINGS,
                ...data.receiptSettings,
            };
            serviceSettings = {
                ...DEFAULT_SERVICE_SETTINGS,
                ...data.serviceSettings,
            };
            whatsappSettings = {
                ...DEFAULT_WHATSAPP_SETTINGS,
                ...data.whatsappSettings,
            };

            isLoaded = true;
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load settings";
            console.error("Failed to load settings:", e);
        } finally {
            isLoading = false;
        }
    }

    async function refresh() {
        isLoaded = false;
        await load();
    }

    return {
        get storeInfo() { return storeInfo; },
        get receiptSettings() { return receiptSettings; },
        get serviceSettings() { return serviceSettings; },
        get whatsappSettings() { return whatsappSettings; },
        get isLoaded() { return isLoaded; },
        get isLoading() { return isLoading; },
        get error() { return error; },
        load,
        refresh,
    };
}

// Export singleton instance
export const settingsStore = createSettingsStore();

// Helper to initialize settings on app load
export async function initializeSettings() {
    if (!settingsStore.isLoaded && !settingsStore.isLoading) {
        await settingsStore.load();
    }
}

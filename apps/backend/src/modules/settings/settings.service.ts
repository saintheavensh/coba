import { db } from "../../db";
import {
    settings,
    salePayments, saleItems, sales,
    purchaseReturnItems, purchaseReturns,
    purchaseItems, purchases,
    services,
    activityLogs, notifications,
    productBatches, productVariants, products,
    categories, suppliers, members
} from "../../db/schema";
import { eq } from "drizzle-orm";

// ============================================
// PAYMENT METHODS (Existing)
// ============================================

export interface PaymentVariant {
    id: string;
    name: string;
    accountNumber?: string;
    accountHolder?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants?: PaymentVariant[];
}

export interface PaymentMethodConfig {
    methods: PaymentMethod[];
}

export const PAYMENT_ICONS = [
    { id: "cash", label: "Tunai", icon: "💵" },
    { id: "bank", label: "Bank", icon: "🏦" },
    { id: "card", label: "Kartu", icon: "💳" },
    { id: "qr", label: "QR Code", icon: "📱" },
    { id: "wallet", label: "Dompet", icon: "👛" },
    { id: "coins", label: "Koin", icon: "🪙" },
    { id: "money", label: "Uang", icon: "💰" },
    { id: "credit", label: "Kredit", icon: "🔖" },
];

// ============================================
// STORE INFO
// ============================================

export interface StoreInfo {
    name: string;
    address: string;
    phone: string;
    email?: string;
    logo?: string;
    socialMedia?: string;
}

// ============================================
// RECEIPT SETTINGS
// ============================================

export interface ReceiptSettings {
    // Header
    showLogo: boolean;
    headerText: string;
    // Footer
    footerText: string;
    termsConditions: string;
    // Display toggles
    showCustomerPhone: boolean;
    showCustomerAddress: boolean;
    showImei: boolean;
    showSparepartDetails: boolean; // OFF = show total only
    showTechnicianName: boolean;
    showWarrantyInfo: boolean;
    // Printer settings
    printerType: "thermal" | "inkjet" | "dotmatrix";
    paperSize: string; // "58mm" | "80mm" | "A4" | "A5"
    printCopies: number;
}

// ============================================
// SERVICE SETTINGS
// ============================================

export interface WarrantyPreset {
    label: string;
    days: number;
}

export interface ServiceSettings {
    // Numbering
    numberFormat: string; // e.g., "SRV-{YYYY}-{XXX}"
    resetCounterYearly: boolean;
    // Workflow
    defaultStatus: "antrian" | "proses";
    autoNotifyOnStatusChange: boolean;
    // Warranty
    warrantyPresets: WarrantyPreset[];
    defaultWarrantyDays: number;
    gracePeriodDays: number;
    // Automation
    autoCloseAfterDays: number;
    reminderBeforePickup: boolean;
    reminderDays: number;
}

// ============================================
// WHATSAPP SETTINGS
// ============================================

export interface WhatsAppSettings {
    enabled: boolean;
    phoneNumber: string;
    // Templates
    newServiceTemplate: string;
    statusUpdateTemplate: string;
    readyForPickupTemplate: string;
    warrantyReminderTemplate: string;
    // Auto-send toggles
    autoSendOnNewService: boolean;
    autoSendOnStatusChange: boolean;
    autoSendOnComplete: boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig = {
    methods: [
        { id: "cash", name: "Tunai", type: "cash", icon: "💵", enabled: true },
        { id: "transfer", name: "Transfer Bank", type: "transfer", icon: "🏦", enabled: true, variants: [] },
        { id: "qris", name: "QRIS", type: "qris", icon: "📱", enabled: true, variants: [] },
    ]
};

const DEFAULT_STORE_INFO: StoreInfo = {
    name: "Toko Service HP",
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
    termsConditions: "Barang yang sudah diambil tidak dapat diklaim kembali",
    showCustomerPhone: true,
    showCustomerAddress: false,
    showImei: false,
    showSparepartDetails: false, // Default: show total only
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
        { label: "2 Minggu", days: 14 },
        { label: "1 Bulan", days: 30 },
        { label: "3 Bulan", days: 90 },
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
    newServiceTemplate: "Halo {customer}, terima kasih telah mempercayakan service HP Anda kepada kami. Nomor service: {serviceNo}. Kami akan menghubungi Anda setelah ada perkembangan.",
    statusUpdateTemplate: "Halo {customer}, status service {serviceNo} Anda telah diupdate menjadi: {status}.",
    readyForPickupTemplate: "Halo {customer}, HP Anda sudah selesai dan siap diambil. Nomor service: {serviceNo}. Total biaya: Rp {total}. Terima kasih!",
    warrantyReminderTemplate: "Halo {customer}, garansi service {serviceNo} Anda akan berakhir dalam {days} hari. Jika ada kendala, segera hubungi kami.",
    autoSendOnNewService: false,
    autoSendOnStatusChange: false,
    autoSendOnComplete: false,
};

// ============================================
// SETTINGS SERVICE
// ============================================

// ============================================
// COMMISSION SETTINGS
// ============================================

export interface CommissionSettings {
    enabled: boolean;
    globalRate: number; // Percentage 0-100
    type: "flat" | "percentage";
    target: "technician" | "all";
}

const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
    enabled: false,
    globalRate: 10,
    type: "percentage",
    target: "technician",
};

// ============================================
// SETTINGS SERVICE
// ============================================

export class SettingsService {
    // ... existing generic methods ...
    async get<T>(key: string, defaultValue: T): Promise<T> {
        const result = await db.query.settings.findFirst({
            where: eq(settings.key, key)
        });
        if (!result) return defaultValue;
        return result.value as T;
    }

    async set<T>(key: string, value: T): Promise<void> {
        const existing = await db.query.settings.findFirst({
            where: eq(settings.key, key)
        });

        if (existing) {
            await db.update(settings)
                .set({ value: value as any })
                .where(eq(settings.key, key));
        } else {
            await db.insert(settings).values({
                key,
                value: value as any
            });
        }
    }

    // Get all settings at once
    async getAll(): Promise<{
        storeInfo: StoreInfo;
        receiptSettings: ReceiptSettings;
        serviceSettings: ServiceSettings;
        whatsappSettings: WhatsAppSettings;
        commissionSettings: CommissionSettings; // Added
    }> {
        const [storeInfo, receiptSettings, serviceSettings, whatsappSettings, commissionSettings] = await Promise.all([
            this.getStoreInfo(),
            this.getReceiptSettings(),
            this.getServiceSettings(),
            this.getWhatsAppSettings(),
            this.getCommissionSettings(),
        ]);
        return { storeInfo, receiptSettings, serviceSettings, whatsappSettings, commissionSettings };
    }

    // ... existing specific methods ...

    // Payment methods
    async getPaymentMethods(): Promise<PaymentMethodConfig> {
        return this.get("payment_methods", DEFAULT_PAYMENT_METHODS);
    }

    async setPaymentMethods(config: PaymentMethodConfig): Promise<void> {
        await this.set("payment_methods", config);
    }

    // Store info
    async getStoreInfo(): Promise<StoreInfo> {
        return this.get("store_info", DEFAULT_STORE_INFO);
    }

    async setStoreInfo(info: StoreInfo): Promise<void> {
        await this.set("store_info", info);
    }

    // Receipt settings
    async getReceiptSettings(): Promise<ReceiptSettings> {
        return this.get("receipt_settings", DEFAULT_RECEIPT_SETTINGS);
    }

    async setReceiptSettings(settings: ReceiptSettings): Promise<void> {
        await this.set("receipt_settings", settings);
    }

    // Service settings
    async getServiceSettings(): Promise<ServiceSettings> {
        return this.get("service_settings", DEFAULT_SERVICE_SETTINGS);
    }

    async setServiceSettings(settings: ServiceSettings): Promise<void> {
        await this.set("service_settings", settings);
    }

    // WhatsApp settings
    async getWhatsAppSettings(): Promise<WhatsAppSettings> {
        return this.get("whatsapp_settings", DEFAULT_WHATSAPP_SETTINGS);
    }

    async setWhatsAppSettings(settings: WhatsAppSettings): Promise<void> {
        await this.set("whatsapp_settings", settings);
    }

    // Commission settings
    async getCommissionSettings(): Promise<CommissionSettings> {
        return this.get("commission_settings", DEFAULT_COMMISSION_SETTINGS);
    }

    async setCommissionSettings(settings: CommissionSettings): Promise<void> {
        await this.set("commission_settings", settings);
    }

    // Factory Reset
    async factoryReset(mode: "data" | "full"): Promise<void> {
        // Clear Transactional Data
        if (mode === "data" || mode === "full") {
            try {
                // Delete in reverse order of dependencies
                await db.delete(salePayments);
                await db.delete(saleItems);
                await db.delete(sales);

                await db.delete(purchaseReturnItems);
                await db.delete(purchaseReturns);

                await db.delete(purchaseItems);
                await db.delete(purchases);

                await db.delete(services);

                await db.delete(activityLogs);
                await db.delete(notifications);

                // Reset stock of products
                if (mode === "full") {
                    await db.delete(productBatches);
                    await db.delete(productVariants);
                    await db.delete(products);
                    await db.delete(categories);
                    await db.delete(suppliers);
                    await db.delete(members);
                    // Keep users/settings
                } else {
                    // Just reset stock counts?
                    // Or maybe we should keep stock history?
                    // Factory reset usually assumes clean slate.
                }
            } catch (e) {
                console.error("Factory Reset Error:", e);
                throw new Error("Failed to reset data");
            }
        }
    }
}

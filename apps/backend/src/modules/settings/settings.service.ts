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
    accountId?: string; // Linked Accounting Account ID
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants?: PaymentVariant[];
    accountId?: string; // Default Linked Accounting Account ID
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
    commissionModel: "completion" | "collection";
    // Warranty
    warrantyPresets: WarrantyPreset[];
    defaultWarrantyDays: number;
    gracePeriodDays: number;
    // Automation
    autoCloseAfterDays: number;
    enableVirtualArchive: boolean;
    archiveExclusions: string[];
    enableLiquidation: boolean;
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
    commissionModel: "completion", // Owner Risk
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
    enableVirtualArchive: true,
    archiveExclusions: ["dikerjakan"],
    enableLiquidation: false,
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
// ACCOUNT MAPPING SETTINGS
// ============================================

export type AccountMappingType =
    | 'asset_tool'              // Peralatan Service
    | 'asset_equipment'         // Peralatan Umum
    | 'asset_furniture'         // Furniture & Perlengkapan
    | 'asset_vehicle'           // Kendaraan
    | 'asset_building'          // Bangunan
    | 'asset_land'              // Tanah
    | 'asset_other'             // Aset Lainnya
    | 'depreciation_expense'    // Beban Penyusutan
    | 'accumulated_depreciation' // Akumulasi Penyusutan (kontra)
    | 'default_cash'            // Default Kas (Sumber Dana)
    | 'owner_equity'            // Modal Pemilik
    | 'sales_revenue'           // Pendapatan Penjualan
    | 'service_revenue'         // Pendapatan Service
    | 'cogs_sales'              // HPP Penjualan
    | 'cogs_service'            // HPP Service
    | 'accounts_payable'        // Hutang Usaha
    | 'accounts_receivable';    // Piutang Usaha

export interface AccountMapping {
    type: AccountMappingType;
    accountId: string;         // e.g., "1-4001"
    label: string;             // Human-readable label for UI
    description?: string;      // Usage notes
}

export interface AccountMappingSettings {
    mappings: AccountMapping[];
}

const DEFAULT_ACCOUNT_MAPPINGS: AccountMappingSettings = {
    mappings: [
        // Fixed Assets
        { type: 'asset_tool', accountId: '1-4001', label: 'Peralatan Service', description: 'Alat service HP/elektronik' },
        { type: 'asset_equipment', accountId: '1-4002', label: 'Peralatan Umum', description: 'Peralatan kantor/toko' },
        { type: 'asset_furniture', accountId: '1-4002', label: 'Furniture & Perlengkapan', description: 'Meja, kursi, rak, display' },
        { type: 'asset_vehicle', accountId: '1-4003', label: 'Kendaraan', description: 'Motor/mobil operasional' },
        { type: 'asset_building', accountId: '1-4004', label: 'Bangunan', description: 'Ruko/gedung' },
        { type: 'asset_land', accountId: '1-4005', label: 'Tanah', description: 'Tanah (tidak disusutkan)' },
        { type: 'asset_other', accountId: '1-4090', label: 'Aset Lainnya', description: 'Aset tetap lainnya' },
        // Depreciation
        { type: 'depreciation_expense', accountId: '5-3000', label: 'Beban Penyusutan', description: 'Beban penyusutan bulanan' },
        { type: 'accumulated_depreciation', accountId: '1-4099', label: 'Akumulasi Penyusutan', description: 'Akun kontra aset' },
        // Default accounts
        { type: 'default_cash', accountId: '1-1001', label: 'Kas Toko', description: 'Sumber dana default untuk pembelian' },
        { type: 'owner_equity', accountId: '3-1000', label: 'Modal Pemilik', description: 'Modal awal pemilik' },
        // Revenue
        { type: 'sales_revenue', accountId: '4-1000', label: 'Pendapatan Penjualan', description: 'Pendapatan dari penjualan barang' },
        { type: 'service_revenue', accountId: '4-2000', label: 'Pendapatan Service', description: 'Pendapatan dari jasa servis' },
        // COGS
        { type: 'cogs_sales', accountId: '5-1001', label: 'HPP Penjualan', description: 'Harga pokok barang terjual' },
        { type: 'cogs_service', accountId: '5-1002', label: 'HPP Service', description: 'Sparepart untuk service' },
        // Payables/Receivables
        { type: 'accounts_payable', accountId: '2-1000', label: 'Hutang Usaha', description: 'Hutang ke supplier' },
        { type: 'accounts_receivable', accountId: '1-2000', label: 'Piutang Usaha', description: 'Piutang dari pelanggan' },
    ]
};

// ============================================
// GENERAL SETTINGS (Accounting Mode)
// ============================================

export type AccountingMode = 'simple' | 'professional';

export interface GeneralSettings {
    accountingMode: AccountingMode;
    accountingSetupComplete: boolean;
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    accountingMode: 'simple',
    accountingSetupComplete: false,
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
        commissionSettings: CommissionSettings;
        accountMappings: AccountMappingSettings;
        generalSettings: GeneralSettings;
    }> {
        const [storeInfo, receiptSettings, serviceSettings, whatsappSettings, commissionSettings, accountMappings, generalSettings] = await Promise.all([
            this.getStoreInfo(),
            this.getReceiptSettings(),
            this.getServiceSettings(),
            this.getWhatsAppSettings(),
            this.getCommissionSettings(),
            this.getAccountMappings(),
            this.getGeneralSettings(),
        ]);
        return { storeInfo, receiptSettings, serviceSettings, whatsappSettings, commissionSettings, accountMappings, generalSettings };
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

    // Account mapping settings
    async getAccountMappings(): Promise<AccountMappingSettings> {
        return this.get("account_mappings", DEFAULT_ACCOUNT_MAPPINGS);
    }

    async setAccountMappings(settings: AccountMappingSettings): Promise<void> {
        await this.set("account_mappings", settings);
    }

    // Helper: Get account ID for a specific mapping type
    async getAccountByType(type: AccountMappingType): Promise<string | null> {
        const mappings = await this.getAccountMappings();
        const found = mappings.mappings.find(m => m.type === type);
        return found?.accountId ?? null;
    }

    // General settings (Accounting Mode)
    async getGeneralSettings(): Promise<GeneralSettings> {
        return this.get("general_settings", DEFAULT_GENERAL_SETTINGS);
    }

    async setGeneralSettings(settings: GeneralSettings): Promise<void> {
        await this.set("general_settings", settings);
    }

    // Helper: Check if in professional accounting mode
    async isProMode(): Promise<boolean> {
        const settings = await this.getGeneralSettings();
        return settings.accountingMode === 'professional' && settings.accountingSetupComplete;
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

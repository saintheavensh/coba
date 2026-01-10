import { db } from "../../db";
import { settings } from "../../db/schema";
import { eq } from "drizzle-orm";

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
    variants?: PaymentVariant[]; // Bank accounts for transfer, QRIS providers, e-wallets, etc.
}

export interface PaymentMethodConfig {
    methods: PaymentMethod[];
}

// Available icons for payment methods
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

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig = {
    methods: [
        { id: "cash", name: "Tunai", type: "cash", icon: "💵", enabled: true },
        { id: "transfer", name: "Transfer Bank", type: "transfer", icon: "🏦", enabled: true, variants: [] },
        { id: "qris", name: "QRIS", type: "qris", icon: "📱", enabled: true, variants: [] },
    ]
};

export class SettingsService {
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

    async getPaymentMethods(): Promise<PaymentMethodConfig> {
        return this.get("payment_methods", DEFAULT_PAYMENT_METHODS);
    }

    async setPaymentMethods(config: PaymentMethodConfig): Promise<void> {
        await this.set("payment_methods", config);
    }
}

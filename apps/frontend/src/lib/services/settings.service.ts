import { api } from "$lib/api";
import type { ApiResponse } from "@repo/shared";

export interface PaymentVariant {
    id: string;
    methodId: string;
    name: string;
    accountNumber?: string | null;
    accountHolder?: string | null;
    enabled: boolean;
    createdAt?: Date;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants?: PaymentVariant[];
    createdAt?: Date;
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

// Payment method type options
export const PAYMENT_TYPES = [
    { id: "cash", label: "Tunai" },
    { id: "transfer", label: "Transfer Bank" },
    { id: "qris", label: "QRIS" },
    { id: "ewallet", label: "E-Wallet" },
    { id: "custom", label: "Lainnya" },
];

export const PaymentMethodsService = {
    // Get all payment methods (for settings page)
    async getAll(): Promise<PaymentMethod[]> {
        const response = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods");
        return response.data.data || [];
    },

    // Get only enabled methods (for payment flow)
    async getEnabled(): Promise<PaymentMethod[]> {
        const response = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods/enabled");
        return response.data.data || [];
    },

    // Create a new payment method
    async create(data: { name: string; type: string; icon: string }): Promise<PaymentMethod> {
        const response = await api.post<ApiResponse<PaymentMethod>>("/payment-methods", data);
        return response.data.data!;
    },

    // Update a payment method
    async update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
        const response = await api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data);
        return response.data.data!;
    },

    // Disable (soft delete) a payment method
    async disable(id: string): Promise<void> {
        await api.delete(`/payment-methods/${id}`);
    },

    // Add a variant to a method
    async addVariant(methodId: string, data: { name: string; accountNumber?: string; accountHolder?: string }): Promise<PaymentMethod> {
        const response = await api.post<ApiResponse<PaymentMethod>>(`/payment-methods/${methodId}/variants`, data);
        return response.data.data!;
    },

    // Update a variant
    async updateVariant(methodId: string, variantId: string, data: Partial<PaymentVariant>): Promise<void> {
        await api.put(`/payment-methods/${methodId}/variants/${variantId}`, data);
    },

    // Disable a variant
    async disableVariant(methodId: string, variantId: string): Promise<void> {
        await api.delete(`/payment-methods/${methodId}/variants/${variantId}`);
    },
};

// Legacy - keep for backward compatibility during migration
export interface PaymentMethodConfig {
    methods: PaymentMethod[];
}

export const SettingsService = {
    async getPaymentMethods(): Promise<PaymentMethodConfig> {
        const methods = await PaymentMethodsService.getAll();
        return { methods };
    },

    async updatePaymentMethods(config: PaymentMethodConfig): Promise<void> {
        // This is now handled via individual CRUD operations
        console.warn("updatePaymentMethods is deprecated. Use PaymentMethodsService instead.");
    },

    async get<T>(key: string): Promise<T | null> {
        try {
            const response = await api.get<ApiResponse<T>>(`/settings/${key}`);
            return response.data.data ?? null;
        } catch {
            return null;
        }
    },

    async set<T>(key: string, value: T): Promise<void> {
        await api.put(`/settings/${key}`, { value });
    }
};

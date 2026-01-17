import { api } from "../api";
import type { ApiResponse } from "@repo/shared";

export interface PaymentVariant {
    id: string;
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    enabled: boolean;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants: PaymentVariant[];
}

export const PaymentService = {
    getEnabledMethods: async (): Promise<PaymentMethod[]> => {
        const res = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods/enabled");
        return res.data?.data ?? [];
    }
};

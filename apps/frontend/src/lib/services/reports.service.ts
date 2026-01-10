import { api } from "../api";
import type { ApiResponse } from "@repo/shared";

export interface SalesSummary {
    totalRevenue: number;
    totalHPP: number;
    totalProfit: number;
    totalTransactions: number;
    totalItems: number;
    profitMargin: number;
}

export interface TransactionReport {
    id: string;
    date: string;
    nota: string;
    customerName: string | null;
    items: number;
    total: number;
    hpp: number;
    profit: number;
}

export interface ServiceStats {
    total: number;
    byStatus: Record<string, number>;
    revenue: number;
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
}

export const ReportsService = {
    /**
     * Get sales summary (revenue, HPP, profit)
     */
    getSummary: async (filters: ReportFilters = {}): Promise<SalesSummary> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<SalesSummary>>(`/reports/summary?${params.toString()}`);
        return res.data.data!;
    },

    /**
     * Get transaction list with profit details
     */
    getTransactions: async (filters: ReportFilters = {}): Promise<TransactionReport[]> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<TransactionReport[]>>(`/reports/transactions?${params.toString()}`);
        return res.data.data || [];
    },

    /**
     * Get service statistics
     */
    getServiceStats: async (filters: ReportFilters = {}): Promise<ServiceStats> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<ServiceStats>>(`/reports/services?${params.toString()}`);
        return res.data.data!;
    }
};

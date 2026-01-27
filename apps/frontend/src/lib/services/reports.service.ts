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

export interface ProfitAndLoss {
    revenue: {
        sales: number;
        services: number;
        total: number;
    };
    cogs: {
        sales: number;
        services: number;
        total: number;
    };
    grossProfit: number;
    expenses: {
        operational: number;
        commissions: number;
        total: number;
    };
    netProfit: number;
}

export interface StockValueReport {
    totalItems: number;
    totalStock: number;
    totalValueHPP: number;
    totalValueSell: number;
    potentialProfit: number;
    categories: {
        name: string;
        stock: number;
        value: number;
    }[];
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
    completed: number;
    byStatus: Record<string, number>;
    revenue: number;
}

export interface ServiceReport {
    id: number;
    no: string;
    date: string;
    customerName: string;
    deviceInfo: string;
    status: string;
    estimatedCost: number;
    actualCost: number;
}

export interface PurchasesSummary {
    totalAmount: number;
    totalTransactions: number;
    totalItems: number;
}

export interface PurchaseReport {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string | null;
    items: number;
    totalAmount: number;
    notes: string | null;
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
    },

    /**
     * Get service transactions list
     */
    getServiceTransactions: async (filters: ReportFilters = {}): Promise<ServiceReport[]> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<ServiceReport[]>>(`/reports/services/transactions?${params.toString()}`);
        return res.data.data || [];
    },

    /**
     * Get purchases summary
     */
    getPurchasesSummary: async (filters: ReportFilters = {}): Promise<PurchasesSummary> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<PurchasesSummary>>(`/reports/purchases/summary?${params.toString()}`);
        return res.data.data!;
    },

    /**
     * Get purchase transactions list
     */
    getPurchaseTransactions: async (filters: ReportFilters = {}): Promise<PurchaseReport[]> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<PurchaseReport[]>>(`/reports/purchases/transactions?${params.toString()}`);
        return res.data.data || [];
    },

    /**
     * Get technician performance statistics
     */
    getTechnicianStats: async (filters: ReportFilters = {}): Promise<TechnicianReport[]> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<TechnicianReport[]>>(`/reports/technicians?${params.toString()}`);
        return res.data.data || [];
    },

    /**
     * Get parts usage report
     */
    getPartsUsageReport: async (filters: ReportFilters = {}): Promise<PartsUsageReport[]> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<PartsUsageReport[]>>(`/reports/parts?${params.toString()}`);
        return res.data.data || [];
    },

    /**
     * Get Profit and Loss summary
     */
    getProfitAndLoss: async (filters: ReportFilters = {}): Promise<ProfitAndLoss> => {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const res = await api.get<ApiResponse<ProfitAndLoss>>(`/reports/profit-loss?${params.toString()}`);
        return res.data.data!;
    },

    /**
     * Get current stock value report
     */
    getStockValueReport: async (): Promise<StockValueReport> => {
        const res = await api.get<ApiResponse<StockValueReport>>(`/reports/stock-value`);
        return res.data.data!;
    },

    /**
     * Get stock adjustment history from opname sessions
     */
    getStockAdjustments: async (): Promise<any[]> => {
        const res = await api.get<ApiResponse<any[]>>("/inventory/opname/adjustment-history");
        return res.data?.data || [];
    }
};

export interface TechnicianReport {
    id: string;
    name: string;
    image: string | null;
    totalServices: number;
    completed: number;
    inProgress: number;
    cancelled: number;
    revenue: number;
    completionRate: number;
}

export interface PartsUsageReport {
    serviceId: number;
    serviceNo: string;
    date: string;
    partName: string;
    source: string;
    variant?: string;
    qty: number;
    price: number;
    subtotal: number;
}



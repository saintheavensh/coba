export interface DashboardStatsDTO {
    totalSales: number;
    totalPurchases: number;
    totalServices: number;
    totalRevenue: number;
}

export interface DashboardServiceTicketDTO {
    id: string;
    no: string;
    customerName: string;
    deviceName: string;
    status: string;
    dateIn: Date;
    estimatedCompletionDate: Date | null;
}

export interface CashierDashboardStatsDTO {
    readyPickup: DashboardServiceTicketDTO[];
    pickedUpToday: number;
    revenueToday: number;
    pendingConfirm: number;
}

export interface DashboardProductDTO {
    id: string;
    name: string;
    stock: number;
    minStock: number;
}

export interface DashboardTopProductDTO {
    id: string;
    name: string;
    sold: number;
}

export interface DashboardPurchaseDTO {
    id: string;
    supplierId: string;
    totalAmount: number;
    status: string | null;
    date: Date | null;
    supplier: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        name: string;
    } | null;
}

export interface WarehouseDashboardStatsDTO {
    totalProducts: number;
    lowStock: number;
    pendingPurchases: number;
}

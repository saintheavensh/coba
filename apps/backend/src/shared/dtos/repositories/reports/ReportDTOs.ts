export interface ReportServiceDTO {
    id: string;
    no: string;
    customerName: string;
    customerPhone: string | null;
    deviceName: string;
    status: string;
    problems: string;
    dateIn: Date | null;
    dateOut: Date | null;
    estimatedCompletionDate: Date | null;
    totalCost: number;
    actualCost: number | null;
    technicianId: string | null;
    parts: {
        id: string;
        name: string;
        qty: number;
        buyPrice: number;
        price: number;
    }[] | null;
    notes: string | null;
}

export interface ReportServiceWithTechnicianDTO extends ReportServiceDTO {
    technician: {
        id: string;
        name: string;
        image: string | null;
        commissionConfig?: {
            enabled: boolean;
            type: "percent" | "fixed";
            value: number;
        };
    } | null;
}

export interface ReportTechnicianDTO {
    id: string;
    name: string;
    role: string;
    image: string | null;
}

export interface ReportActivityLogDTO {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    description: string | null;
    createdAt: Date | null;
    user: {
        id: string;
        name: string;
    } | null;
}

export interface ReportOperationalCostDTO {
    id: string;
    category: string;
    amount: number;
    date: Date | null;
    description: string | null;
    status: string | null;
}

export interface ReportLowStockDTO {
    id: string;
    currentStock: number;
    variantLink: {
        id: string;
        product: {
            id: string;
            name: string;
        };
    } | null;
}

export interface ReportSalePaymentDTO {
    id: string;
    saleId: string;
    amount: number;
    method: string;
    reference: string | null;
    createdAt: Date | null;
}

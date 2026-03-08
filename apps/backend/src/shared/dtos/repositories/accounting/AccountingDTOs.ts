export interface RevenueTargetDTO {
    id: string;
    month: string;
    workingDays: number;
    monthlyOperational: number;
    monthlyDepreciation: number;
    monthlyTotal: number;
    dailyBreakeven: number;
    profitMarginPercent: number;
    dailyTarget: number;
    createdBy: string | null;
    createdAt: Date | null;
}

export interface AccountTypeDTO {
    id: string;
    name: string;
    normalBalance: "debit" | "credit";
    createdAt: Date | null;
}

export interface AccountingPurchasePaymentDTO {
    id: string;
    purchaseId: string;
    amount: number;
    method: string;
    date: Date | null;
    reference: string | null | undefined;
    notes: string | null | undefined;
    supplierId?: string | null | undefined;
    accountId?: string | null | undefined;
    journalId?: string | null | undefined;
    createdBy?: string | null | undefined;
}

export interface AccountingCommissionPaymentDTO {
    id: string;
    technicianId: string;
    period: string;
    amount: number;
    status: "pending" | "paid";
    serviceIds?: string[] | null | undefined;
    paidAt: Date | null;
    createdAt: Date | null;
    paidBy?: string | null | undefined;
    journalId?: string | null | undefined;
    accountId?: string | null | undefined;
}

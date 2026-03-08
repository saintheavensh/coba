import { CashTransactionDTO } from "./CashTransactionDTO";

export interface RegisterSummaryDTO {
    transactionCount: number;
    byType: {
        sale: { count: number; total: number };
        service: { count: number; total: number };
        expense: { count: number; total: number };
        refund: { count: number; total: number };
        adjustment: { count: number; total: number };
    };
    totalIn: number;
    totalOut: number;
}

export interface TodayProgressDTO {
    isOpen: boolean;
    registerId?: string;
    openingBalance?: number;
    expectedClosing?: number;
    totalSales: number;
    totalServices: number;
    totalExpenses?: number;
    transactionCount?: number;
    recentTransactions?: CashTransactionDTO[];
}

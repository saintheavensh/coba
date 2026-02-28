export type CashRegisterStatus = "open" | "closed";

export interface CashRegister {
    id: string; // Changed from number to string (UUID in schema)
    openedAt: Date;
    openedBy: string;
    openingBalance: number;
    closedAt?: Date;
    closedBy?: string;
    expectedClosing?: number;
    actualClosing?: number;
    difference?: number;
    status: CashRegisterStatus;
    notes?: string;
}

export type TransactionType = "sale" | "expense" | "deposit" | "withdrawal" | "service" | "refund" | "adjustment";

export interface CashTransaction {
    id: string; // Changed from number to string (UUID in schema)
    registerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
    createdAt: Date;
}

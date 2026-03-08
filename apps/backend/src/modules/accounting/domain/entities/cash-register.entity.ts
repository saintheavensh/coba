export type CashRegisterStatus = "open" | "closed";

export interface CashRegister {
    id: string; // Changed from number to string (UUID in schema)
    openedAt: Date;
    openedBy: string;
    openingBalance: number;
    closedAt?: Date | undefined;
    closedBy?: string | undefined;
    expectedClosing?: number | undefined;
    actualClosing?: number | undefined;
    difference?: number | undefined;
    status: CashRegisterStatus;
    notes?: string | undefined;
}

export type TransactionType = "sale" | "expense" | "deposit" | "withdrawal" | "service" | "refund" | "adjustment";

export interface CashTransaction {
    id: string; // Changed from number to string (UUID in schema)
    registerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
    createdAt: Date;
}

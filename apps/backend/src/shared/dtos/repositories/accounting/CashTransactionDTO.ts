export interface CashTransactionDTO {
    id: string;
    registerId: string;
    type: "sale" | "service" | "expense" | "refund" | "adjustment";
    amount: number;
    notes?: string | null | undefined;
    createdAt: Date;
}

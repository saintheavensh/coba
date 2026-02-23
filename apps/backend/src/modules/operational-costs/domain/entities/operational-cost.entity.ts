export type OperationalCostStatus = "paid" | "pending" | "cancelled";

export interface OperationalCost {
    id: string;
    category: string;
    amount: number;
    date: Date;
    description?: string | null;
    status: OperationalCostStatus;
    dueDate?: Date | null;
    paidAt?: Date | null;
    userId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOperationalCostInput {
    category: string;
    amount: number;
    date?: string | Date;
    description?: string;
    status?: OperationalCostStatus;
    dueDate?: string | Date;
    sourceAccountId?: string;
    expenseAccountId?: string;
}

export interface PurchaseReportDTO {
    id: string;
    supplierId: string;
    userId: string | null;
    totalAmount: number;
    status: "DRAFT" | "ORDERED" | "RECEIVED" | "VERIFIED" | "CANCELLED" | null;
    date: Date | null;
    supplier: {
        id: string;
        name: string;
    };
    items: {
        id: string;
        productId: string;
        qtyOrdered: number;
        qtyReceived: number;
        buyPrice: number;
    }[];
}

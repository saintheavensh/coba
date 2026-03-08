export interface SaleReportDTO {
    id: string;
    memberId: string | null;
    customerName: string | null;
    totalAmount: number;
    discountAmount: number | null;
    paymentMethod: "cash" | "transfer" | "qris" | "mixed";
    paymentStatus: "paid" | "partial" | "unpaid";
    userId: string;
    notes: string | null;
    createdAt: Date | null;
    items: {
        id: string;
        productId: string;
        batchId: string;
        variant: string | null;
        qty: number;
        price: number;
        batch: {
            id: string;
            currentStock: number;
            buyPrice: number;
            expiredAt: Date | null;
        };
    }[];
}

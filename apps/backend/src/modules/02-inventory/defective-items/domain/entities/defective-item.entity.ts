export type DefectiveItemStatus = "pending" | "processed" | "cancelled";
export type DefectiveItemSource = "manual" | "sales_return" | "service_return";

export interface DefectiveItem {
    id: string;
    productId: string;
    batchId: string;
    supplierId: string;
    qty: number;
    reason: string;
    status: DefectiveItemStatus;
    source: DefectiveItemSource;
    sourceRefId?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Relations
    product?: any;
    batch?: any;
    supplier?: any;
}

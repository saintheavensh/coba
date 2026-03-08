export interface InventoryReportDTO {
    id: string;
    name: string;
    products: {
        id: string;
        name: string;
        batches: {
            id: string;
            currentStock: number;
            buyPrice: number;
            sellPrice: number;
        }[];
    }[];
}

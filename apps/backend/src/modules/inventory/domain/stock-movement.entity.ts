/**
 * Domain entity for stock movement audit trail.
 * NOT persisted yet — designed for future accounting integration.
 */
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "REVERSAL";
export type StockReferenceType = "PURCHASE" | "SALE" | "OPNAME" | "MANUAL";

export interface StockMovementEntity {
    id: string;
    productId: string;
    variantId: string | null;
    batchId: string | null;
    movementType: StockMovementType;
    quantity: number;
    referenceType: StockReferenceType;
    referenceId: string;
    createdAt: Date;
}

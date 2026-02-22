/**
 * Port for stock opname persistence. Keeps the stock opname use case independent of DB.
 */

// --- Domain DTOs for Stock Opname ---

export interface OpnameSessionEntity {
    id: string;
    userId: string;
    notes?: string | null;
    status: string;
    createdAt?: Date;
    completedAt?: Date | null;
    user?: unknown;
}

export interface OpnameItemEntity {
    id: number;
    sessionId: string;
    productId: string;
    variantName: string;
    systemStock: number;
    physicalStock: number | null;
    adjustmentReason?: string | null;
    difference: number;
    product?: unknown;
}

export interface OpnameBatchEntity {
    id: string;
    productId: string;
    variantId: string | null;
    variant?: string | null;
    buyPrice: number;
    currentStock: number;
    createdAt?: Date;
}

export interface AdjustmentHistoryRow {
    id: number;
    sessionId: string;
    productId: string;
    productName: string;
    variantName: string;
    systemStock: number;
    physicalStock: number | null;
    difference: number;
    reason: string | null;
    completedAt: Date | null;
    userId: string;
    userName: string;
}

export interface InsertSessionData {
    id: string;
    userId: string;
    notes?: string;
    status: string;
}

export interface InsertItemData {
    sessionId: string;
    productId: string;
    variantName: string;
    systemStock: number;
}

// --- Port Interface ---

export interface IStockOpnameRepository {
    /** Insert a new opname session row. */
    insertSession(data: InsertSessionData, dbOrTx?: unknown): Promise<void>;

    /** Update session status (and optionally completedAt). */
    updateSessionStatus(id: string, status: string, completedAt?: Date, dbOrTx?: unknown): Promise<void>;

    /** Bulk-insert opname items for a session. */
    insertItems(items: InsertItemData[], dbOrTx?: unknown): Promise<void>;

    /** Update an opname item's physical stock and reason. */
    updateItem(itemId: number, physicalStock: number, reason?: string, dbOrTx?: unknown): Promise<OpnameItemEntity | null>;

    /** Get all sessions ordered by creation desc. */
    findSessions(dbOrTx?: unknown): Promise<OpnameSessionEntity[]>;

    /** Get a session by ID (without items). */
    findSessionById(id: string, dbOrTx?: unknown): Promise<OpnameSessionEntity | null>;

    /** Get all items for a session, with product details and computed difference. */
    findItemsBySession(sessionId: string, dbOrTx?: unknown): Promise<OpnameItemEntity[]>;

    /** Get product IDs that belong to a category. */
    findProductIdsByCategory(categoryId: string, dbOrTx?: unknown): Promise<string[]>;

    /** Get batches, optionally filtered by product IDs. */
    findAllBatches(productIds?: string[], dbOrTx?: unknown): Promise<OpnameBatchEntity[]>;

    /** Find batches for a product, optionally filtered by variant name. */
    findBatchesByProductAndVariant(
        productId: string,
        variantName: string | null,
        dbOrTx?: unknown
    ): Promise<OpnameBatchEntity[]>;

    /** Resolve a variant name to a variant ID for a given product. */
    resolveVariantId(productId: string, variantName: string, dbOrTx?: unknown): Promise<string | null>;

    /** Update a single batch's stock. */
    updateBatchStock(batchId: string, newStock: number, dbOrTx?: unknown): Promise<void>;

    /** Adjust parent product stock by a delta. */
    updateProductStockDelta(productId: string, delta: number, dbOrTx?: unknown): Promise<void>;

    /** Get adjustment history rows for completed sessions with differences. */
    getAdjustmentHistoryRows(dbOrTx?: unknown): Promise<AdjustmentHistoryRow[]>;

    /** Run a callback inside a database transaction. */
    transaction<T>(fn: (tx: unknown) => Promise<T>, dbOrTx?: unknown): Promise<T>;
}

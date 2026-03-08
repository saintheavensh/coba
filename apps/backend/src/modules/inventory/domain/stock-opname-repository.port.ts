/**
 * Port for stock opname persistence. Keeps the stock opname use case independent of DB.
 */
import { DBContext } from "../../../shared/types/db-context";

// --- Domain DTOs for Stock Opname ---

export interface OpnameSessionEntity {
    id: string;
    userId: string;
    notes?: string | null | undefined;
    status: string;
    createdAt?: Date | undefined;
    completedAt?: Date | null | undefined;
    user?: unknown | undefined;
}

export interface OpnameItemEntity {
    id: number;
    sessionId: string;
    productId: string;
    variantName: string;
    systemStock: number;
    physicalStock: number | null;
    adjustmentReason?: string | null | undefined;
    difference: number;
    product?: unknown | undefined;
}

export interface OpnameBatchEntity {
    id: string;
    productId: string;
    variantId: string | null;
    variant?: string | null;
    buyPrice: number;
    currentStock: number;
    createdAt?: Date | undefined;
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
    notes?: string | undefined;
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
    insertSession(data: InsertSessionData, dbOrTx?: DBContext): Promise<void>;

    /** Update session status (and optionally completedAt). */
    updateSessionStatus(id: string, status: string, completedAt?: Date, dbOrTx?: DBContext): Promise<void>;

    /** Bulk-insert opname items for a session. */
    insertItems(items: InsertItemData[], dbOrTx?: DBContext): Promise<void>;

    /** Update an opname item's physical stock and reason. */
    updateItem(itemId: number, physicalStock: number, reason?: string, dbOrTx?: DBContext): Promise<OpnameItemEntity | null>;

    /** Get all sessions ordered by creation desc. */
    findSessions(dbOrTx?: DBContext): Promise<OpnameSessionEntity[]>;

    /** Get a session by ID (without items). */
    findSessionById(id: string, dbOrTx?: DBContext): Promise<OpnameSessionEntity | null>;

    /** Get all items for a session, with product details and computed difference. */
    findItemsBySession(sessionId: string, dbOrTx?: DBContext): Promise<OpnameItemEntity[]>;

    /** Get product IDs that belong to a category. */
    findProductIdsByCategory(categoryId: string, dbOrTx?: DBContext): Promise<string[]>;

    /** Get batches, optionally filtered by product IDs. */
    findAllBatches(productIds?: string[], dbOrTx?: DBContext): Promise<OpnameBatchEntity[]>;

    /** Find batches for a product, optionally filtered by variant name. */
    findBatchesByProductAndVariant(
        productId: string,
        variantName: string | null,
        dbOrTx?: DBContext
    ): Promise<OpnameBatchEntity[]>;

    /** Resolve a variant name to a variant ID for a given product. */
    resolveVariantId(productId: string, variantName: string, dbOrTx?: DBContext): Promise<string | null>;

    /** Update a single batch's stock. */
    updateBatchStock(batchId: string, newStock: number, dbOrTx?: DBContext): Promise<void>;

    /** Adjust parent product stock by a delta. */
    updateProductStockDelta(productId: string, delta: number, dbOrTx?: DBContext): Promise<void>;

    /** Get adjustment history rows for completed sessions with differences. */
    getAdjustmentHistoryRows(dbOrTx?: DBContext): Promise<AdjustmentHistoryRow[]>;

    /** Run a callback inside a database transaction. */
    transaction<T>(fn: (tx: DBContext) => Promise<T>, dbOrTx?: DBContext): Promise<T>;
}

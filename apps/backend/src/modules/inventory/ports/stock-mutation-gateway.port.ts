/**
 * Port for stock mutations (single gate). Use cases depend on this, not on Drizzle/schema.
 */
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput
} from "../types/stock.types";

export interface IStockMutationGateway {
    deductStockFIFO(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput>;
    addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput>;
}

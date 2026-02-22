/**
 * Port for stock mutations (single gate). Use cases depend on this, not on Drizzle/schema.
 * Also includes stock consistency assertion (previously in helpers/).
 */
import type {
    DeductStockFIFOInput,
    DeductStockFIFOOutput,
    AddStockFromPurchaseVerificationInput,
    AddStockFromPurchaseVerificationOutput,
    ReverseStockInput
} from "./stock.types";

export interface IStockMutationGateway {
    deductStockFIFO(input: DeductStockFIFOInput, dbOrTx: unknown): Promise<DeductStockFIFOOutput>;
    addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        dbOrTx: unknown
    ): Promise<AddStockFromPurchaseVerificationOutput>;
    reverseStockFromPurchaseDeletion(input: ReverseStockInput, dbOrTx: unknown): Promise<void>;
    assertStockConsistency(productIds: string[], dbOrTx: unknown): Promise<void>;
}

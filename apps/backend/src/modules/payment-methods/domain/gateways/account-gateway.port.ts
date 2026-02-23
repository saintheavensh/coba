import { DBContext } from "../../../../shared/types/db-context";

export interface IAccountGateway {
    /**
     * Ensures an account exists in COA for this payment method/variant.
     */
    ensureAccount(name: string, type: string, providedAccountId?: string, dbOrTx?: DBContext): Promise<string>;
}

import { DBContext } from "../../../../shared/types/db-context";

export interface IAccountingGateway {
    createJournal(params: {
        description: string;
        referenceType: string;
        referenceId: string;
        date?: Date;
        lines: Array<{
            accountId: string;
            debit: number;
            credit: number;
            description: string;
        }>;
    }, userId?: string, dbOrTx?: DBContext): Promise<void>;
}

import { DBContext } from "../../../../shared/types/db-context";
import { accountingService } from "../../../accounting/accounting-container";
import { IAccountingGateway } from "../../domain";

export class AccountingGatewayAdapter implements IAccountingGateway {
    async createJournal(params: {
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
    }, userId?: string, dbOrTx?: DBContext): Promise<void> {
        await accountingService.createJournal({
            ...params,
            referenceType: params.referenceType
        }, userId, dbOrTx);
    }
}

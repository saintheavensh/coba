import { DBContext } from "../../../../shared/types/db-context";
import { accountingService } from "../../../accounting/accounting-container";
import { IAccountingGateway } from "../../domain";

export class AccountingGatewayAdapter implements IAccountingGateway {
    async isRegisterOpen(dbOrTx?: DBContext): Promise<boolean> {
        return await accountingService.isRegisterOpen(dbOrTx);
    }

    async recordCashTransaction(params: {
        transactionType: string;
        transactionId: string;
        amount: number;
        description: string;
    }, dbOrTx?: DBContext): Promise<void> {
        await accountingService.recordCashTransaction({
            transactionType: params.transactionType as any,
            transactionId: params.transactionId,
            amount: params.amount,
            description: params.description
        }, dbOrTx);
    }

    async createJournal(params: {
        description: string;
        referenceType: string;
        referenceId: string;
        lines: Array<{ accountId: string; debit: number; credit: number; description: string }>;
    }, userId: string, dbOrTx?: DBContext): Promise<void> {
        await accountingService.createJournal({
            description: params.description,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            lines: params.lines
        }, userId, dbOrTx);
    }
}

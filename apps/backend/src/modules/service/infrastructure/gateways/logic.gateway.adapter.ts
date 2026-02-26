import { DBContext } from "../../../../shared/types/db-context";
import { accountingService } from "../../../accounting/accounting-container";
import { db } from "../../../../db";
import { productBatches } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { IAccountingGateway, IInventoryGateway } from "../../domain";

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

export class InventoryGatewayAdapter implements IInventoryGateway {
    async getBatch(batchId: string, dbOrTx?: DBContext): Promise<any> {
        const client = (dbOrTx as any) || db;
        const rows = await client.select()
            .from(productBatches)
            .where(eq(productBatches.id, batchId))
            .for('update');
        return rows[0];
    }

    async updateStock(batchId: string, delta: number, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const batch = await this.getBatch(batchId, dbOrTx);
        if (!batch) return;

        await client.update(productBatches).set({
            currentStock: batch.currentStock + delta,
            updatedAt: new Date()
        }).where(eq(productBatches.id, batchId));
    }
}

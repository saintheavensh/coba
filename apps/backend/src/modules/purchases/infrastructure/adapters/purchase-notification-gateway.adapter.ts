import { db } from "../../../../db";
import { DBContext } from "../../../../shared/types/db-context";
import { notifications } from "../../../../db/schema";
import { INotificationGateway } from "../../domain/purchase-repository.port";

export class PurchaseNotificationGatewayAdapter implements INotificationGateway {
    async notifyPurchaseOrderCreated(
        payload: { purchaseId: string; userId: string; supplierId: string },
        dbOrTx?: DBContext
    ): Promise<void> {
        const client = dbOrTx || db;

        await client.insert(notifications).values({
            userId: "user-warehouse-001",
            type: "po_action_required",
            title: "New Purchase Order",
            message: `New Order ${payload.purchaseId} requires receiving.`,
            entityType: "purchase",
            entityId: payload.purchaseId,
        });
    }

    async notifyGoodsReceived(
        payload: { purchaseId: string; userId: string; hasDiscrepancy: boolean },
        dbOrTx?: DBContext
    ): Promise<void> {
        const client = dbOrTx || db;

        await client.insert(notifications).values({
            userId: payload.userId,
            type: payload.hasDiscrepancy ? "po_discrepancy" : "po_action_required",
            title: payload.hasDiscrepancy ? "PO Discrepancy Found" : "Goods Received",
            message: payload.hasDiscrepancy
                ? `Order ${payload.purchaseId} has quantity mismatches. Please verify.`
                : `Order ${payload.purchaseId} has been received. Please verify and set prices.`,
            entityType: "purchase",
            entityId: payload.purchaseId,
        });
    }
}


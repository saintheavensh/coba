import { IPurchaseRepository, INotificationGateway } from "../../domain/purchase-repository.port";
import { db } from "../../../../db";

export interface ReceiveGoodsDto {
    purchaseId: string;
    receivedByUserId: string;
    items: {
        productId: string;
        variantId?: string;
        qty: number;
    }[];
}

export class ReceiveGoodsUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private notificationGateway: INotificationGateway
    ) { }

    async execute(dto: ReceiveGoodsDto, dbOrTx?: any): Promise<{ message: string; id: string; hasDiscrepancy: boolean }> {
        const effectiveDb = dbOrTx || db;

        return await effectiveDb.transaction(async (tx: any) => {
            const purchase = await this.purchaseRepo.findById(dto.purchaseId);
            if (!purchase) {
                throw new Error(`Purchase order ${dto.purchaseId} not found`);
            }
            let hasDiscrepancy = false;
            // Discrepancy check: if any received qty != ordered qty
            for (const item of dto.items) {
                const poItem = purchase.items.find(i => i.productId === item.productId && i.variantId === (item.variantId || undefined));
                if (!poItem) {
                    throw new Error(`Product ${item.productId} not found in this purchase order`);
                }
                if (item.qty > poItem.qtyOrdered) {
                    throw new Error(`Cannot receive more than ordered for product ${item.productId}. Ordered: ${poItem.qtyOrdered}, Received: ${item.qty}`);
                }
                if (item.qty !== poItem.qtyOrdered) {
                    hasDiscrepancy = true;
                }
            }

            purchase.receiveItems(dto.items, dto.receivedByUserId);

            await this.purchaseRepo.save(purchase, tx);

            // Notifications
            const snapshot = purchase.toSnapshot();
            if (snapshot.userId) {
                await this.notificationGateway.notifyGoodsReceived(
                    {
                        purchaseId: dto.purchaseId,
                        userId: snapshot.userId,
                        hasDiscrepancy
                    },
                    tx
                );
            }

            return { message: "Goods received logged", id: dto.purchaseId, hasDiscrepancy };
        });
    }
}

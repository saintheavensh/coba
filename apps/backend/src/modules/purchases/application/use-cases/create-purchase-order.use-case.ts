import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { PurchaseOrder, PurchaseItem } from "../../domain/entities/purchase.entity";
import { randomUUID } from "crypto";

export interface CreatePurchaseOrderDto {
    supplierId: string;
    userId: string;
    totalAmount: number;
    referenceNumber?: string;
    notes?: string;
    items: {
        productId: string;
        variantId?: string;
        qtyOrdered: number;
        buyPrice: number;
        sellPrice: number;
    }[];
}

export class CreatePurchaseOrderUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }

    async execute(dto: CreatePurchaseOrderDto): Promise<string> {
        const purchaseId = `PO-${Date.now().toString().slice(-6)}`; // Simple naming convention

        const items = dto.items.map(i => new PurchaseItem({
            productId: i.productId,
            variantId: i.variantId,
            qtyOrdered: i.qtyOrdered,
            qtyReceived: 0,
            buyPrice: i.buyPrice,
            sellPrice: i.sellPrice
        }));

        const purchase = new PurchaseOrder({
            id: purchaseId,
            supplierId: dto.supplierId,
            userId: dto.userId,
            totalAmount: dto.totalAmount,
            status: "DRAFT",
            items: items,
            date: new Date(),
            referenceNumber: dto.referenceNumber,
            notes: dto.notes
        });

        await this.purchaseRepo.save(purchase);
        return purchaseId;
    }
}

import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { DomainError } from "../../domain/entities/purchase.entity";

export interface ReceiveGoodsDto {
    purchaseId: string;
    items: {
        productId: string;
        variantId?: string;
        qty: number;
    }[];
}

export class ReceiveGoodsUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }

    async execute(dto: ReceiveGoodsDto): Promise<void> {
        const purchase = await this.purchaseRepo.findById(dto.purchaseId);
        if (!purchase) {
            throw new Error(`Purchase order ${dto.purchaseId} not found`);
        }

        // Domain validation (lifecycle and over-receive) happens inside receiveItems
        purchase.receiveItems(dto.items);

        await this.purchaseRepo.save(purchase);
    }
}

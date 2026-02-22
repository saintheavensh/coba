import { IPurchaseRepository } from "../../domain/purchase-repository.port";

export class GetPurchasesUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }
    async execute(filters?: any) {
        return await this.purchaseRepo.findAll(filters);
    }
}

export class GetPurchaseByIdUseCase {
    constructor(private purchaseRepo: IPurchaseRepository) { }
    async execute(id: string) {
        return await this.purchaseRepo.findById(id);
    }
}

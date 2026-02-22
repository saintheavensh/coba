import { PurchaseRepositoryAdapter } from "./infrastructure/adapters/purchase-repository.adapter";
import { PurchasePaymentRepositoryAdapter } from "./infrastructure/adapters/purchase-payment-repository.adapter";
import { CreatePurchaseOrderUseCase } from "./application/use-cases/create-purchase-order.use-case";
import { ReceiveGoodsUseCase } from "./application/use-cases/receive-goods.use-case";
import { VerifyAndCompletePurchaseUseCase } from "./application/use-cases/verify-and-complete-purchase.use-case";
import { CancelPurchaseOrderUseCase } from "./application/use-cases/cancel-purchase-order.use-case";
import { DeletePurchaseUseCase } from "./application/use-cases/delete-purchase.use-case";
import { GetPurchasesUseCase, GetPurchaseByIdUseCase } from "./application/use-cases/query-purchases.use-case";

import { productsService } from "../products/products-container";
import { inventoryService } from "../inventory/inventory-container";

// 1. Adapters
const purchaseRepo = new PurchaseRepositoryAdapter();
const paymentRepo = new PurchasePaymentRepositoryAdapter();

// 2. Use Cases
const createPurchaseOrderUC = new CreatePurchaseOrderUseCase(purchaseRepo);
const receiveGoodsUC = new ReceiveGoodsUseCase(purchaseRepo);
const verifyAndCompletePurchaseUC = new VerifyAndCompletePurchaseUseCase(purchaseRepo, productsService, inventoryService);
const cancelPurchaseOrderUC = new CancelPurchaseOrderUseCase(purchaseRepo, inventoryService);
const deletePurchaseUC = new DeletePurchaseUseCase(purchaseRepo, inventoryService);
const getPurchasesUC = new GetPurchasesUseCase(purchaseRepo);
const getPurchaseByIdUC = new GetPurchaseByIdUseCase(purchaseRepo);

// 3. Facade Service (Thin Wrapper)
export class PurchasesService {
    async getAll(filters?: any) {
        return getPurchasesUC.execute(filters);
    }

    async getById(id: string) {
        return getPurchaseByIdUC.execute(id);
    }

    async createOrder(data: any) {
        return createPurchaseOrderUC.execute(data);
    }

    async receiveGoods(purchaseId: string, userId: string, items: any[]) {
        return receiveGoodsUC.execute({ purchaseId, items });
    }

    async verifyAndComplete(purchaseId: string, userId: string, items: any[], options: any = {}) {
        return verifyAndCompletePurchaseUC.execute({ purchaseId, userId });
    }

    async cancelOrder(id: string, userId: string, reason?: string) {
        return cancelPurchaseOrderUC.execute(id);
    }

    async deletePurchase(id: string) {
        return deletePurchaseUC.execute(id);
    }
}

/** Singleton instance for use in controllers/routes */
export const purchasesService = new PurchasesService();

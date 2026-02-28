import { db } from "../../../shared/infrastructure/database/client";
import {
    OperationalCostRepositoryAdapter,
    AccountingGatewayAdapter
} from "./infrastructure";
import {
    GetOperationalCostsUseCase,
    CreateOperationalCostUseCase,
    MarkAsPaidUseCase,
    DeleteOperationalCostUseCase
} from "./application";

// Adapters
const repository = new OperationalCostRepositoryAdapter();
const accountingGateway = new AccountingGatewayAdapter();

// Use Cases
const getCostsUC = new GetOperationalCostsUseCase(repository);
const createCostUC = new CreateOperationalCostUseCase(repository, accountingGateway, db as any);
const markAsPaidUC = new MarkAsPaidUseCase(repository, accountingGateway, db as any);
const deleteCostUC = new DeleteOperationalCostUseCase(repository);

/**
 * OperationalCostsService — Facade for external and presentation layers.
 */
export class OperationalCostsService {
    async getAll() {
        return await getCostsUC.execute(100);
    }

    async create(data: any, userId?: string) {
        return await createCostUC.execute(data, userId);
    }

    async markAsPaid(id: string, paymentData: any, userId?: string) {
        return await markAsPaidUC.execute(id, paymentData, userId);
    }

    async delete(id: string) {
        return await deleteCostUC.execute(id);
    }
}

/** Singleton instance */
export const operationalCostsService = new OperationalCostsService();

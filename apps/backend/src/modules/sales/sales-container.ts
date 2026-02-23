import { db } from "../../db";
import {
    SaleRepositoryAdapter,
    InventoryGatewayAdapter,
    AccountingGatewayAdapter,
    MemberGatewayAdapter,
    SettingsGatewayAdapter
} from "./infrastructure";
import { GetSalesUseCase, GetSaleByIdUseCase, CreateSaleUseCase } from "./application";
import { Sale, CreateSaleInput } from "./domain";

// Adapters
const repository = new SaleRepositoryAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const accountingGateway = new AccountingGatewayAdapter();
const memberGateway = new MemberGatewayAdapter();
const settingsGateway = new SettingsGatewayAdapter();

// Use Cases
const getSalesUC = new GetSalesUseCase(repository);
const getSaleByIdUC = new GetSaleByIdUseCase(repository);
const createSaleUC = new CreateSaleUseCase(
    repository,
    inventoryGateway,
    accountingGateway,
    memberGateway,
    settingsGateway,
    db as any
);

/**
 * SalesService — Facade for external and presentation layers.
 */
export class SalesService {
    async getAll(query: { startDate?: string; endDate?: string; search?: string; limit?: string }): Promise<Sale[]> {
        return await getSalesUC.execute(query);
    }

    async getById(id: string): Promise<Sale> {
        return await getSaleByIdUC.execute(id);
    }

    async createSale(data: CreateSaleInput): Promise<{ message: string; id: string; change: number }> {
        return await createSaleUC.execute(data);
    }
}

/** Singleton instance */
export const salesService = new SalesService();

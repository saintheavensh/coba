import { db } from "../../../shared/infrastructure/database/client";
import {
    SaleRepositoryAdapter,
    InventoryGatewayAdapter,
    AccountingGatewayAdapter,
    MemberGatewayAdapter,
    SettingsGatewayAdapter,
    ApprovalGatewayAdapter
} from "./infrastructure";
import { ApprovalCheckService } from "../../04-finance/approvals/domain/services/ApprovalCheckService";
import { DrizzleApprovalRepository } from "../../04-finance/approvals/infrastructure/repositories/DrizzleApprovalRepository";
import { SettingsRepositoryAdapter } from "../../05-shared/settings/infrastructure/repositories/settings.repository.adapter";
import { GetSalesUseCase, GetSaleByIdUseCase, CreateSaleUseCase } from "./application";
import { Sale, CreateSaleInput } from "./domain";

// Adapters
const repository = new SaleRepositoryAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const accountingGateway = new AccountingGatewayAdapter();
const memberGateway = new MemberGatewayAdapter();
const settingsGateway = new SettingsGatewayAdapter();

// Dependency from other modules (Approvals)
const settingsRepo = new SettingsRepositoryAdapter();
const approvalRepo = new DrizzleApprovalRepository();
const approvalCheckService = new ApprovalCheckService(settingsRepo);
const approvalGateway = new ApprovalGatewayAdapter(approvalCheckService, approvalRepo);

// Use Cases
const getSalesUC = new GetSalesUseCase(repository);
const getSaleByIdUC = new GetSaleByIdUseCase(repository);
const createSaleUC = new CreateSaleUseCase(
    repository,
    inventoryGateway,
    accountingGateway,
    memberGateway,
    settingsGateway,
    approvalGateway,
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

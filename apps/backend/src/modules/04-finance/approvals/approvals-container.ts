import { DrizzleApprovalRepository } from "./infrastructure/repositories/DrizzleApprovalRepository";
import { ApprovalCheckService } from "./domain/services/ApprovalCheckService";
import { RequestApprovalUseCase } from "./application/use-cases/request-approval.use-case";
import { ApproveApprovalUseCase } from "./application/use-cases/approve-approval.use-case";
import { SettingsRepositoryAdapter } from "../../05-shared/settings/infrastructure/repositories/settings.repository.adapter";
import { Approval } from "./domain";

// Adapters
const repository = new DrizzleApprovalRepository();
const settingsRepo = new SettingsRepositoryAdapter();

// Services
const checkService = new ApprovalCheckService(settingsRepo);

// Use Cases
const requestApprovalUC = new RequestApprovalUseCase(repository, checkService);
const approveApprovalUC = new ApproveApprovalUseCase(repository);

export class ApprovalsService {
    async getPending(): Promise<Approval[]> {
        return await repository.findPending();
    }

    async getById(id: string): Promise<Approval | null> {
        return await repository.findById(id);
    }

    async getHistory(filters?: { type?: string; status?: string }): Promise<Approval[]> {
        return await repository.findHistory(filters);
    }

    async getStats(): Promise<{ pending: number; approved: number; rejected: number; totalAmount: number }> {
        return await repository.getStats();
    }

    async requestApproval(data: any): Promise<any> {
        return await requestApprovalUC.execute(data);
    }

    async approve(data: any): Promise<any> {
        return await approveApprovalUC.execute(data);
    }

    async reject(id: string, reason: string): Promise<any> {
        return await repository.update(id, {
            status: 'REJECTED' as any,
            reason,
            approvedAt: new Date() as any,
        });
    }
}

export const approvalsService = new ApprovalsService();

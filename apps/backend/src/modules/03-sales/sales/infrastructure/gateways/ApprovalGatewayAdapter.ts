import { IApprovalGateway } from "../../domain/gateways";
import { ApprovalCheckService } from "../../../../04-finance/approvals/domain/services/ApprovalCheckService";
import { IApprovalRepository } from "../../../../04-finance/approvals/domain";

export class ApprovalGatewayAdapter implements IApprovalGateway {
    constructor(
        private readonly checkService: ApprovalCheckService,
        private readonly repository: IApprovalRepository
    ) { }

    async needsApproval(type: 'DISCOUNT' | 'VOID' | 'REFUND', amount: number, data?: any): Promise<boolean> {
        return this.checkService.needsApproval(type, amount, data);
    }

    async isApproved(approvalId: string, entityType: string, entityId?: string): Promise<boolean> {
        const approval = await this.repository.findById(approvalId);
        if (!approval) return false;

        // Basic checks
        if (approval.status !== 'APPROVED') return false;
        if (approval.entityType !== entityType) return false;
        // if entityId is provided (for void/refund), check it
        if (entityId && approval.entityId !== entityId) return false;

        return true;
    }
}

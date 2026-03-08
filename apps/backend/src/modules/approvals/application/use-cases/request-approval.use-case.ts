import { IApprovalRepository, ApprovalType } from "../../domain";
import { ApprovalCheckService } from "../../domain/services/ApprovalCheckService";

export interface RequestApprovalInput {
    type: ApprovalType;
    entityType: string;
    entityId: string;
    requestedById: string;
    amount: number;
    reason?: string;
    data?: any;
}

export class RequestApprovalUseCase {
    constructor(
        private readonly repository: IApprovalRepository,
        private readonly checkService: ApprovalCheckService
    ) { }

    async execute(input: RequestApprovalInput) {
        const needsApproval = await this.checkService.needsApproval(input.type, input.amount, input.data);

        if (!needsApproval) {
            return { needsApproval: false };
        }

        const approval = await this.repository.save({
            type: input.type,
            entityType: input.entityType,
            entityId: input.entityId,
            requestedById: input.requestedById,
            status: 'PENDING',
            reason: input.reason ?? undefined,
            data: input.data ?? undefined
        });

        return {
            needsApproval: true,
            approvalId: approval.id,
            message: "Approval required for this transaction."
        };
    }
}

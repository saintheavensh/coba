import { IApprovalRepository, ApprovalStatus } from "../../domain";
import { HTTPException } from "hono/http-exception";

export interface ApproveApprovalInput {
    approvalId: string;
    approvedById: string;
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
}

export class ApproveApprovalUseCase {
    constructor(private readonly repository: IApprovalRepository) { }

    async execute(input: ApproveApprovalInput) {
        const approval = await this.repository.findById(input.approvalId);
        if (!approval) {
            throw new HTTPException(404, { message: "Approval request not found." });
        }

        if (approval.status !== 'PENDING') {
            throw new HTTPException(400, { message: `Approval is already ${approval.status}` });
        }

        const updated = await this.repository.update(input.approvalId, {
            status: input.status,
            approvedById: input.approvedById,
            approvedAt: new Date(),
            reason: input.reason
        });

        return updated;
    }
}

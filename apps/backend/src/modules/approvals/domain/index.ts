export type ApprovalType = 'DISCOUNT' | 'REFUND' | 'PURCHASE' | 'VOID' | 'SERVICE_DISCOUNT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approval {
    id: string;
    type: ApprovalType;
    entityType: string;
    entityId: string;
    requestedById: string;
    requestedAt: Date;
    status: ApprovalStatus;
    approvedById?: string | undefined;
    approvedAt?: Date | undefined;
    reason?: string | undefined;
    data?: any | undefined;
}

export interface IApprovalRepository {
    findById(id: string): Promise<Approval | null>;
    findByEntity(entityType: string, entityId: string): Promise<Approval[]>;
    save(approval: Partial<Approval>): Promise<Approval>;
    update(id: string, approval: Partial<Approval>): Promise<Approval>;
    findPending(): Promise<Approval[]>;
}

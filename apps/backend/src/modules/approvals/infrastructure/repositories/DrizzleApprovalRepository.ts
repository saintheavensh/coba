import { eq, and } from "drizzle-orm";
import { db } from "../../../../db";
import { approvals } from "../schema/ApprovalSchema";
import { Approval, IApprovalRepository } from "../../domain";

export class DrizzleApprovalRepository implements IApprovalRepository {
    async findById(id: string): Promise<Approval | null> {
        const result = await db.query.approvals.findFirst({
            where: eq(approvals.id, id),
            with: {
                requestedBy: true,
                approvedBy: true,
            }
        });
        return (result as any) || null;
    }

    async findByEntity(entityType: string, entityId: string): Promise<Approval[]> {
        const result = await db.query.approvals.findMany({
            where: and(
                eq(approvals.entityType, entityType),
                eq(approvals.entityId, entityId)
            ),
            with: {
                requestedBy: true,
                approvedBy: true,
            }
        });
        return result as any[];
    }

    async save(data: Partial<Approval>): Promise<Approval> {
        const [result] = await db.insert(approvals).values(data as any).returning();
        return result as any;
    }

    async update(id: string, data: Partial<Approval>): Promise<Approval> {
        const [result] = await db.update(approvals)
            .set(data as any)
            .where(eq(approvals.id, id))
            .returning();
        return result as any;
    }

    async findPending(): Promise<Approval[]> {
        const result = await db.query.approvals.findMany({
            where: eq(approvals.status, 'PENDING'),
            with: {
                requestedBy: true,
            }
        });
        return result as any[];
    }
}

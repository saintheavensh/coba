import { eq, and, ne, sql, count } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
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

    async findHistory(filters?: { type?: string; status?: string }): Promise<Approval[]> {
        const conditions: any[] = [ne(approvals.status, 'PENDING')];
        if (filters?.type) {
            conditions.push(eq(approvals.type, filters.type as any));
        }
        if (filters?.status) {
            conditions.push(eq(approvals.status, filters.status as any));
        }

        const result = await db.query.approvals.findMany({
            where: and(...conditions),
            with: {
                requestedBy: true,
                approvedBy: true,
            },
            orderBy: (a: any, { desc }: any) => [desc(a.requestedAt)]
        });
        return result as any[];
    }

    async getStats(): Promise<{ pending: number; approved: number; rejected: number; totalAmount: number }> {
        const rows = await db.select({
            status: approvals.status,
            count: count(),
        }).from(approvals).groupBy(approvals.status);

        const stats = { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
        for (const row of rows) {
            if (row.status === 'PENDING') stats.pending = Number(row.count);
            else if (row.status === 'APPROVED') stats.approved = Number(row.count);
            else if (row.status === 'REJECTED') stats.rejected = Number(row.count);
        }
        return stats;
    }
}

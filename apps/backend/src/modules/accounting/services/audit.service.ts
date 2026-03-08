import { db } from "../../../db";
import { auditLogs } from "../../../db/schema";
import { desc, eq, and } from "drizzle-orm";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VOID" | "POST" | "CLOSE" | "PAY";

export interface AuditLogInput {
    userId?: string | undefined;
    action: AuditAction;
    entityType: string;
    entityId: string;
    tableName: string;
    oldValues?: Record<string, unknown> | undefined;
    newValues?: Record<string, unknown> | undefined;
    reason?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}

import { injectable } from "inversify";

@injectable()
export class AuditService {
    /**
     * Create an audit log entry
     */
    public async log(input: AuditLogInput): Promise<void> {
        await db.insert(auditLogs).values({
            userId: input.userId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            tableName: input.tableName,
            oldValues: input.oldValues,
            newValues: input.newValues,
            reason: input.reason,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        });
    }

    /**
     * Get audit logs for a specific entity
     */
    public async getByEntity(entityType: string, entityId: string) {
        return db
            .select()
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.entityType, entityType),
                    eq(auditLogs.entityId, entityId)
                )
            )
            .orderBy(desc(auditLogs.createdAt));
    }

    /**
     * Get audit logs with pagination and optional filtering
     */
    public async getAll(filters: { limit?: number; offset?: number; entityType?: string | undefined; entityId?: string | undefined } = {}) {
        const { limit = 100, offset = 0, entityType, entityId } = filters;

        const conditions = [];
        if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
        if (entityId) conditions.push(eq(auditLogs.entityId, entityId));

        const query = db.query.auditLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            limit,
            offset,
            orderBy: [desc(auditLogs.createdAt)],
            with: {
                user: true
            }
        });

        return await query;
    }
}

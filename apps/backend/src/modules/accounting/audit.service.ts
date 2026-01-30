import { db } from "../../db";
import { auditLogs } from "../../db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VOID" | "POST" | "CLOSE" | "PAY";

export interface AuditLogInput {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    tableName: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    userId?: string;
    entityType?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
}

export class AuditService {
    /**
     * Create an audit log entry
     */
    static async log(input: AuditLogInput): Promise<void> {
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
     * Get audit logs with filters
     */
    static async getAll(filters: AuditLogFilters = {}) {
        const { startDate, endDate, userId, entityType, action, limit = 50, offset = 0 } = filters;

        const conditions = [];

        if (startDate) {
            conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
        }
        if (userId) {
            conditions.push(eq(auditLogs.userId, userId));
        }
        if (entityType) {
            conditions.push(eq(auditLogs.entityType, entityType));
        }
        if (action) {
            conditions.push(eq(auditLogs.action, action));
        }

        const query = db
            .select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.timestamp))
            .limit(limit)
            .offset(offset);

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }

    /**
     * Get audit logs for a specific entity
     */
    static async getByEntity(entityType: string, entityId: string) {
        return db
            .select()
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.entityType, entityType),
                    eq(auditLogs.entityId, entityId)
                )
            )
            .orderBy(desc(auditLogs.timestamp));
    }

    /**
     * Helper to calculate the difference between old and new values
     */
    static getDiff(
        oldValues: Record<string, unknown>,
        newValues: Record<string, unknown>
    ): { field: string; old: unknown; new: unknown }[] {
        const diff: { field: string; old: unknown; new: unknown }[] = [];

        for (const key of Object.keys(newValues)) {
            if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                diff.push({
                    field: key,
                    old: oldValues[key],
                    new: newValues[key],
                });
            }
        }

        return diff;
    }
}

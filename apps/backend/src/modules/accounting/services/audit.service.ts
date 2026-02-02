import { AuditModel } from "../models/audit.model";
import { db } from "../../../db";
import { auditLogs } from "../../../db/schema";
import { desc, eq, and } from "drizzle-orm";

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
        await AuditModel.create({
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
    static async getLogs(filters: AuditLogFilters = {}) {
        return AuditModel.findAll(filters);
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
            .orderBy(desc(auditLogs.createdAt));
    }
}

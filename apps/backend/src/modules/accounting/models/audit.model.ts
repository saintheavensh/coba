import { db } from "../../../db";
import { auditLogs } from "../../../db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export class AuditModel {
    static async create(data: any) {
        return db.insert(auditLogs).values(data);
    }

    static async findAll(filters: any) {
        let where = and();
        if (filters.startDate) where = and(where, gte(auditLogs.createdAt, new Date(filters.startDate)));
        if (filters.endDate) where = and(where, lte(auditLogs.createdAt, new Date(filters.endDate)));
        if (filters.userId) where = and(where, eq(auditLogs.userId, filters.userId));
        if (filters.entityType) where = and(where, eq(auditLogs.entityType, filters.entityType));
        if (filters.action) where = and(where, eq(auditLogs.action, filters.action));

        return db
            .select()
            .from(auditLogs)
            .where(where)
            .orderBy(desc(auditLogs.createdAt))
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);
    }
}

import { DBContext } from "../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, ActivityLogReport } from "../../domain";
import { gte, lte, eq } from "drizzle-orm";
import { activityLogs } from "../../../../db/schema";

export class GetActivityLogsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(filters: ReportFilters & { userId?: string; action?: string; entityType?: string; limit?: number } = {}, dbOrTx?: DBContext): Promise<ActivityLogReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(activityLogs.createdAt, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(activityLogs.createdAt, end));
        }
        if (filters.userId && filters.userId !== 'all') {
            conditions.push(eq(activityLogs.userId, filters.userId));
        }
        if (filters.action && filters.action !== 'all') {
            conditions.push(eq(activityLogs.action, filters.action as any));
        }
        if (filters.entityType && filters.entityType !== 'all') {
            conditions.push(eq(activityLogs.entityType, filters.entityType));
        }

        const logs = await this.repository.getActivityLogs(conditions, filters.limit, dbOrTx);

        return logs.map((log: any) => ({
            id: log.id,
            timestamp: log.createdAt,
            user: log.user ? { id: log.user.id, name: log.user.name, role: log.user.role } : { id: 'SYSTEM', name: 'System', role: 'system' },
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            description: log.description,
            details: {
                oldValue: log.oldValue ? JSON.parse(log.oldValue as string) : null,
                newValue: log.newValue ? JSON.parse(log.newValue as string) : null
            }
        }));
    }
}

/**
 * Adapter for activity logging. Implements IActivityLogger from domain.
 * Delegates to the existing ActivityLogService infrastructure.
 */
import type { IActivityLogger, ActivityLogEntry } from "../domain/activity-logger.port";
import { ActivityLogService } from "../../../lib/activity-log.service";

export class ActivityLoggerAdapter implements IActivityLogger {
    async log(entry: ActivityLogEntry, dbOrTx?: unknown): Promise<void> {
        return ActivityLogService.log(
            {
                userId: entry.userId,
                action: entry.action as any,
                entityType: entry.entityType,
                entityId: entry.entityId,
                description: entry.description,
                details: entry.details as any
            },
            dbOrTx
        );
    }
}

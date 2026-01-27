import { db } from "../db";
import { activityLogs } from "../db/schema";
import { Logger } from "./logger";

export interface LogParams {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN" | "LOGOUT" | "EXPORT" | "ASSIGN";
    entityType: string;
    entityId: string;
    description?: string;
    details?: {
        oldValue?: any;
        newValue?: any;
    };
}

export class ActivityLogService {
    static async log(params: LogParams) {
        try {
            await db.insert(activityLogs).values({
                userId: params.userId,
                action: params.action as any,
                entityType: params.entityType,
                entityId: params.entityId,
                description: params.description || null,
                oldValue: params.details?.oldValue || null,
                newValue: params.details?.newValue || null,
            } as any);
            Logger.info(`[ACTIVITY_LOG] ${params.action} on ${params.entityType}:${params.entityId} by User:${params.userId}`);
        } catch (error) {
            Logger.error(`[ACTIVITY_LOG_ERROR] Failed to insert log:`, error);
            // Don't throw error to avoid breaking main flow
        }
    }

    // Helper for simple descriptions
    static async logSimple(userId: string, action: LogParams["action"], entityType: string, entityId: string, description: string) {
        return this.log({ userId, action, entityType, entityId, description });
    }
}

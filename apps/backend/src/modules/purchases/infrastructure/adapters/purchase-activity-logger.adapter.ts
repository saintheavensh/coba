import { DBContext } from "../../../../shared/types/db-context";
import { ActivityLogService } from "../../../../shared/utils/logging";
import { IActivityLogger } from "../../domain/purchase-repository.port";

export class PurchaseActivityLoggerAdapter implements IActivityLogger {
    async log(entry: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        description: string;
    }, dbOrTx?: DBContext): Promise<void> {
        await ActivityLogService.log(entry as any, dbOrTx);
    }
}


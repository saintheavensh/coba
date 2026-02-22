/**
 * Stock opname service facade — wraps opname use cases.
 */
import type { CreateOpnameSessionUseCase } from "../application/use-cases/create-opname-session.use-case";
import type { GetOpnameSessionsUseCase } from "../application/use-cases/get-opname-sessions.use-case";
import type { GetOpnameSessionDetailsUseCase } from "../application/use-cases/get-opname-session-details.use-case";
import type { UpdateOpnameItemUseCase } from "../application/use-cases/update-opname-item.use-case";
import type { FinalizeOpnameSessionUseCase } from "../application/use-cases/finalize-opname-session.use-case";
import type { CancelOpnameSessionUseCase } from "../application/use-cases/cancel-opname-session.use-case";
import type { GetAdjustmentHistoryUseCase } from "../application/use-cases/get-adjustment-history.use-case";

export class StockOpnameService {
    constructor(
        private readonly createSessionUC: CreateOpnameSessionUseCase,
        private readonly getSessionsUC: GetOpnameSessionsUseCase,
        private readonly getSessionDetailsUC: GetOpnameSessionDetailsUseCase,
        private readonly updateItemUC: UpdateOpnameItemUseCase,
        private readonly finalizeSessionUC: FinalizeOpnameSessionUseCase,
        private readonly cancelSessionUC: CancelOpnameSessionUseCase,
        private readonly getAdjustmentHistoryUC: GetAdjustmentHistoryUseCase
    ) { }

    async createSession(userId: string, notes?: string, categoryId?: string): Promise<string> {
        return this.createSessionUC.execute(userId, notes, categoryId);
    }

    async getSessions() {
        return this.getSessionsUC.execute();
    }

    async getSessionDetails(id: string) {
        return this.getSessionDetailsUC.execute(id);
    }

    async updateItem(itemId: number, physicalStock: number, reason?: string) {
        return this.updateItemUC.execute(itemId, physicalStock, reason);
    }

    async finalizeSession(id: string, userId: string) {
        return this.finalizeSessionUC.execute(id, userId);
    }

    async cancelSession(id: string, userId: string) {
        return this.cancelSessionUC.execute(id, userId);
    }

    async getAdjustmentHistory() {
        return this.getAdjustmentHistoryUC.execute();
    }
}

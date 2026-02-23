import { DBContext } from "../../../../shared/types/db-context";
import { ICashRegisterRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export class OpenRegisterUseCase {
    constructor(private readonly registerRepository: ICashRegisterRepository) { }

    async execute(openingBalance: number, userId: string, dbOrTx?: DBContext): Promise<string> {
        const current = await this.registerRepository.getCurrent(dbOrTx);
        if (current) {
            throw new Error("A cash register is already open. Close it first.");
        }

        const { id } = await this.registerRepository.create({
            openedAt: new Date(),
            openedBy: userId,
            openingBalance,
            status: "open",
        }, dbOrTx);

        await AuditService.log({
            userId,
            action: "CREATE" as any,
            entityType: "cash_register",
            entityId: String(id),
            tableName: "cash_registers",
            newValues: { openingBalance },
        });

        return String(id);
    }
}

import { DBContext } from "../../../../../shared/types/db-context";
import { IAccountRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export class DeleteAccountUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(id: string, userId?: string, dbOrTx?: DBContext): Promise<void> {
        const account = await this.accountRepository.findById(id, dbOrTx);
        if (!account) {
            throw new Error(`Account ${id} not found`);
        }

        if (account.isSystem) {
            throw new Error("Cannot delete system account");
        }

        if (account.balance !== 0) {
            throw new Error("Cannot delete account with non-zero balance. Please transfer the balance first.");
        }

        const allAccounts = await this.accountRepository.findAll({}, dbOrTx);
        const hasChildren = allAccounts.some((a) => a.parentId === id);
        if (hasChildren) {
            throw new Error("Cannot delete account that has child accounts. Please delete the children first.");
        }

        await this.accountRepository.delete(id, dbOrTx);

        await AuditService.log({
            userId,
            action: "DELETE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            oldValues: { name: account.name, code: account.code },
        });
    }
}

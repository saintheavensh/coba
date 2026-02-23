import { DBContext } from "../../../../shared/types/db-context";
import { IAccountRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export interface UpdateAccountInput {
    name?: string;
    description?: string;
    isActive?: boolean;
}

export class UpdateAccountUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(id: string, input: UpdateAccountInput, userId?: string, dbOrTx?: DBContext): Promise<void> {
        const oldAccount = await this.accountRepository.findById(id, dbOrTx);
        if (!oldAccount) {
            throw new Error(`Account ${id} not found`);
        }

        if (oldAccount.isSystem) {
            if (input.name && input.name !== oldAccount.name) {
                throw new Error("Cannot rename system account");
            }
            if (input.isActive !== undefined && input.isActive !== oldAccount.isActive) {
                throw new Error("Cannot change active status of system account");
            }
        }

        await this.accountRepository.update(id, {
            ...input,
            updatedAt: new Date(),
        }, dbOrTx);

        await AuditService.log({
            userId,
            action: "UPDATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            oldValues: { name: oldAccount.name, description: oldAccount.description, isActive: oldAccount.isActive },
            newValues: input as Record<string, unknown>,
        });
    }
}

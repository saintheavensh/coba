import { DBContext } from "../../../../shared/types/db-context";
import { IAccountRepository, AccountType } from "../../domain";
import { AuditService } from "../../services/audit.service";

export interface CreateAccountInput {
    code: string;
    name: string;
    typeId: AccountType;
    parentId?: string;
    description?: string;
    isSystem?: boolean;
}

export class CreateAccountUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(input: CreateAccountInput, userId?: string, dbOrTx?: DBContext): Promise<string> {
        const type = await this.accountRepository.findTypeById(input.typeId, dbOrTx);
        if (!type) {
            throw new Error(`Account type ${input.typeId} not found`);
        }

        const typePrefix = this.getTypePrefix(input.typeId);
        const id = `${typePrefix}-${input.code}`;

        await this.accountRepository.create({
            id,
            code: input.code,
            name: input.name,
            typeId: input.typeId,
            parentId: input.parentId,
            description: input.description,
            isSystem: input.isSystem || false,
            balance: 0,
        }, dbOrTx);

        await AuditService.log({
            userId,
            action: "CREATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            newValues: { code: input.code, name: input.name, typeId: input.typeId },
        });

        return id;
    }

    private getTypePrefix(typeId: string): string {
        const prefixes: Record<string, string> = {
            ASSET: "1",
            LIABILITY: "2",
            EQUITY: "3",
            REVENUE: "4",
            EXPENSE: "5",
        };
        return prefixes[typeId] || "9";
    }
}

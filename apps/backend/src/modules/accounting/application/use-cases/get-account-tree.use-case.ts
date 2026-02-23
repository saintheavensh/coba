import { DBContext } from "../../../../shared/types/db-context";
import { IAccountRepository, Account } from "../../domain";

export class GetAccountTreeUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(filters: { typeId?: string } = {}, dbOrTx?: DBContext): Promise<any[]> {
        const allAccounts = await this.accountRepository.findAll(filters, dbOrTx);

        const accountMap = new Map<string, any>();
        const roots: any[] = [];

        for (const account of allAccounts) {
            accountMap.set(account.id, { ...account, children: [] });
        }

        for (const account of allAccounts) {
            const node = accountMap.get(account.id);
            if (account.parentId) {
                const parent = accountMap.get(account.parentId);
                if (parent) {
                    parent.children.push(node);
                }
            } else {
                roots.push(node);
            }
        }

        return roots;
    }
}

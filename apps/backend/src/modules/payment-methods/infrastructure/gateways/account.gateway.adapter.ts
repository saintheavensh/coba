import { eq, and, like, desc } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { accounts } from "../../../../db/schema";
import { IAccountGateway } from "../../domain";

export class AccountGatewayAdapter implements IAccountGateway {
    async ensureAccount(name: string, _type: string, providedAccountId?: string, dbOrTx?: DBContext): Promise<string> {
        const client = (dbOrTx as any) || db;

        if (providedAccountId) return providedAccountId;

        const parentId = "1-1000"; // Kas & Bank
        const prefix = "10"; // Base for 10xx codes

        // Try searching by name first
        const existing = await client.query.accounts.findFirst({
            where: and(
                eq(accounts.parentId, parentId),
                eq(accounts.name, name)
            )
        });

        if (existing) return existing.id;

        // Create new account
        // Find next code in 10xx range
        const lastAccount = await client.query.accounts.findFirst({
            where: like(accounts.code, `${prefix}%`),
            orderBy: [desc(accounts.code)]
        });

        const nextNum = lastAccount ? (parseInt(lastAccount.code) + 1) : 1001;
        const nextCode = nextNum.toString();
        const nextId = `1-${nextCode}`;

        await client.insert(accounts).values({
            id: nextId,
            code: nextCode,
            name: name,
            typeId: "ASSET",
            parentId: parentId,
            isActive: true,
            balance: 0
        });

        return nextId;
    }
}

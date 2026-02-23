import { eq } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { db } from "../../../../db";
import { members } from "../../../../db/schema";
import { IMemberGateway } from "../../domain";

export class MemberGatewayAdapter implements IMemberGateway {
    async findById(id: string, dbOrTx?: DBContext): Promise<any> {
        const client = (dbOrTx as any) || db;
        return await client.query.members.findFirst({
            where: eq(members.id, id)
        });
    }

    async updateDebt(id: string, delta: number, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const member = await this.findById(id, dbOrTx);
        if (!member) return;

        await client.update(members)
            .set({ debt: (member.debt || 0) + delta })
            .where(eq(members.id, id));
    }
}

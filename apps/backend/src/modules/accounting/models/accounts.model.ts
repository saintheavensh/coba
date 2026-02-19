import { db } from "../../../db";
import { accounts, accountTypes } from "../../../db/schema";
import { eq } from "drizzle-orm";

export class AccountModel {
    static async findAll(filters: { typeId?: string } = {}, dbOrTx: any = db) {
        let query = dbOrTx
            .select({
                id: accounts.id,
                code: accounts.code,
                name: accounts.name,
                typeId: accounts.typeId,
                typeName: accountTypes.name,
                parentId: accounts.parentId,
                description: accounts.description,
                isActive: accounts.isActive,
                isSystem: accounts.isSystem,
                balance: accounts.balance,
            })
            .from(accounts)
            .leftJoin(accountTypes, eq(accounts.typeId, accountTypes.id))
            .orderBy(accounts.code);

        if (filters.typeId) {
            query = query.where(eq(accounts.typeId, filters.typeId));
        }

        return query;
    }

    static async findTypes(dbOrTx: any = db) {
        return dbOrTx.select().from(accountTypes).orderBy(accountTypes.id);
    }

    static async findById(id: string, dbOrTx: any = db) {
        const [account] = await dbOrTx
            .select()
            .from(accounts)
            .where(eq(accounts.id, id));
        return account;
    }

    static async findTypeById(id: string, dbOrTx: any = db) {
        const [type] = await dbOrTx
            .select()
            .from(accountTypes)
            .where(eq(accountTypes.id, id));
        return type;
    }

    static async findByCode(code: string, dbOrTx: any = db) {
        const [account] = await dbOrTx
            .select()
            .from(accounts)
            .where(eq(accounts.code, code));
        return account;
    }

    static async create(data: any, dbOrTx: any = db) {
        return dbOrTx.insert(accounts).values(data).returning({ id: accounts.id });
    }

    static async update(id: string, data: any, dbOrTx: any = db) {
        return dbOrTx.update(accounts).set(data).where(eq(accounts.id, id));
    }

    static async delete(id: string, dbOrTx: any = db) {
        return dbOrTx.delete(accounts).where(eq(accounts.id, id));
    }

    static async deleteByTypeId(typeId: string, dbOrTx: any = db) {
        return dbOrTx.delete(accounts).where(eq(accounts.typeId, typeId));
    }
}

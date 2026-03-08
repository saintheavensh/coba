import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { DrizzleClient } from "../../../../shared/infrastructure/database/DrizzleClient";
import { IUserRepository, User, CreateUserData, UpdateUserData } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class CreateUserUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private readonly repository: IUserRepository,
        @inject(TYPES.DrizzleClient) private readonly dbClient: DrizzleClient
    ) { }

    async execute(data: CreateUserData, dbOrTx?: DBContext): Promise<User> {
        const { roles, ...userData } = data;

        const runInTransaction = async (tx: DBContext) => {
            const user = await this.repository.create(userData, tx);

            if (roles && roles.length > 0) {
                await this.repository.syncRoles(user.id, roles, tx);
            }

            const finalUser = await this.repository.findById(user.id, tx);
            if (!finalUser) throw new HTTPException(500, { message: "Failed to retrieve created user" });
            return finalUser;
        };

        if (dbOrTx) {
            return await runInTransaction(dbOrTx);
        } else {
            return await this.dbClient.getClient().transaction(runInTransaction);
        }
    }
}

@injectable()
export class UpdateUserUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private readonly repository: IUserRepository,
        @inject(TYPES.DrizzleClient) private readonly dbClient: DrizzleClient
    ) { }

    async execute(id: string, data: UpdateUserData, dbOrTx?: DBContext): Promise<User> {
        const { roles, ...userData } = data;

        const runInTransaction = async (tx: DBContext) => {
            const existing = await this.repository.findById(id, tx);
            if (!existing) {
                throw new HTTPException(404, { message: "User not found" });
            }

            await this.repository.update(id, userData, tx);

            if (roles !== undefined) {
                await this.repository.syncRoles(id, roles, tx);
            }

            const updated = await this.repository.findById(id, tx);
            if (!updated) throw new HTTPException(500, { message: "Failed to retrieve updated user" });
            return updated;
        };

        if (dbOrTx) {
            return await runInTransaction(dbOrTx);
        } else {
            return await this.dbClient.getClient().transaction(runInTransaction);
        }
    }
}

@injectable()
export class DeleteUserUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private readonly repository: IUserRepository
    ) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "User not found" });
        }
        await this.repository.delete(id, dbOrTx);
    }
}

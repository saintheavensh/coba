import { DBContext } from "../../../../shared/types/db-context";
import { IUserRepository, User, CreateUserData, UpdateUserData } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateUserUseCase {
    constructor(
        private readonly repository: IUserRepository,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(data: CreateUserData, dbOrTx?: DBContext): Promise<User> {
        const { roles, ...userData } = data;

        const runInTransaction = async (tx: DBContext) => {
            const user = await this.repository.create(userData, tx);

            if (roles && roles.length > 0) {
                await this.repository.syncRoles(user.id, roles, tx);
            }

            return await this.repository.findById(user.id, tx) as User;
        };

        if (dbOrTx) {
            return await runInTransaction(dbOrTx);
        } else {
            return await this.db.transaction(runInTransaction);
        }
    }
}

export class UpdateUserUseCase {
    constructor(
        private readonly repository: IUserRepository,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
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

            return await this.repository.findById(id, tx) as User;
        };

        if (dbOrTx) {
            return await runInTransaction(dbOrTx);
        } else {
            return await this.db.transaction(runInTransaction);
        }
    }
}

export class DeleteUserUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "User not found" });
        }
        await this.repository.delete(id, dbOrTx);
    }
}

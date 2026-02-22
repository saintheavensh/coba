import type { IUserRepository, UserWithRoles } from "../ports/user-repository.port";
import { AuthModel } from "../models/auth.model";

export class UserRepositoryAdapter implements IUserRepository {
    private model = new AuthModel();

    async findByUsername(username: string, dbOrTx?: unknown): Promise<UserWithRoles | null> {
        const row = await this.model.findByUsername(username, dbOrTx);
        return row as UserWithRoles | null;
    }

    async findById(id: string, dbOrTx?: unknown): Promise<UserWithRoles | null> {
        const row = await this.model.findById(id, dbOrTx);
        return row as UserWithRoles | null;
    }
}

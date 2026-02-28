import { DBContext } from "../../../../../shared/types/db-context";
import { User, CreateUserData, UpdateUserData } from "../entities/user.entity";

export interface IUserRepository {
    findAll(role?: string, dbOrTx?: DBContext): Promise<User[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<User | null>;
    create(data: Omit<CreateUserData, 'roles'>, dbOrTx?: DBContext): Promise<User>;
    update(id: string, data: Omit<UpdateUserData, 'roles'>, dbOrTx?: DBContext): Promise<User>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;

    // Role synchronization
    syncRoles(userId: string, roles: string[], dbOrTx?: DBContext): Promise<void>;
}

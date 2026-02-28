import { db } from "../../../shared/infrastructure/database/client";
import { UserRepositoryAdapter } from "./infrastructure";
import {
    GetUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase
} from "./application";
import { User, CreateUserData, UpdateUserData } from "./domain";

// Infrastructure adapters
const repository = new UserRepositoryAdapter();

// Use cases
const getUsersUC = new GetUsersUseCase(repository);
const getUserByIdUC = new GetUserByIdUseCase(repository);
const createUserUC = new CreateUserUseCase(repository, db as any);
const updateUserUC = new UpdateUserUseCase(repository, db as any);
const deleteUserUC = new DeleteUserUseCase(repository);

/**
 * UsersService — facade for external and presentation layers.
 */
export class UsersService {
    async findAll(role?: string, dbOrTx?: any): Promise<User[]> {
        return await getUsersUC.execute(role, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any): Promise<User> {
        return await getUserByIdUC.execute(id, dbOrTx);
    }

    async create(data: CreateUserData, dbOrTx?: any): Promise<User> {
        return await createUserUC.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateUserData, dbOrTx?: any): Promise<User> {
        return await updateUserUC.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: any): Promise<void> {
        return await deleteUserUC.execute(id, dbOrTx);
    }
}

/** Singleton service instance */
export const usersService = new UsersService();

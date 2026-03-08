import { ContainerModule } from "inversify";
import { TYPES } from "./types";
import { UserRepositoryAdapter } from "./infrastructure";
import {
    GetUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase
} from "./application";
import { IUserRepository, User, CreateUserData, UpdateUserData } from "./domain";
import { injectable, inject } from "inversify";
import { DBContext } from "../../shared/types/db-context";

/**
 * Users Module Container
 */
export const usersContainerModule = new ContainerModule(({ bind }) => {
    // Repositories
    bind<IUserRepository>(TYPES.IUserRepository).to(UserRepositoryAdapter).inSingletonScope();

    // Use Cases
    bind<GetUsersUseCase>(TYPES.GetUsersUseCase).to(GetUsersUseCase).inSingletonScope();
    bind<GetUserByIdUseCase>(TYPES.GetUserByIdUseCase).to(GetUserByIdUseCase).inSingletonScope();
    bind<CreateUserUseCase>(TYPES.CreateUserUseCase).to(CreateUserUseCase).inSingletonScope();
    bind<UpdateUserUseCase>(TYPES.UpdateUserUseCase).to(UpdateUserUseCase).inSingletonScope();
    bind<DeleteUserUseCase>(TYPES.DeleteUserUseCase).to(DeleteUserUseCase).inSingletonScope();

    // Facade/Service
    bind<UsersService>(TYPES.UsersService).to(UsersService).inSingletonScope();
});

import { Container } from "inversify";

@injectable()
export class UsersService {
    constructor(
        @inject(TYPES.GetUsersUseCase) private readonly getUsersUC: GetUsersUseCase,
        @inject(TYPES.GetUserByIdUseCase) private readonly getUserByIdUC: GetUserByIdUseCase,
        @inject(TYPES.CreateUserUseCase) private readonly createUserUC: CreateUserUseCase,
        @inject(TYPES.UpdateUserUseCase) private readonly updateUserUC: UpdateUserUseCase,
        @inject(TYPES.DeleteUserUseCase) private readonly deleteUserUC: DeleteUserUseCase
    ) { }

    async findAll(role?: string, dbOrTx?: DBContext): Promise<User[]> {
        return await this.getUsersUC.execute(role, dbOrTx);
    }

    async getById(id: string, dbOrTx?: DBContext): Promise<User> {
        return await this.getUserByIdUC.execute(id, dbOrTx);
    }

    async create(data: CreateUserData, dbOrTx?: DBContext): Promise<User> {
        return await this.createUserUC.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateUserData, dbOrTx?: DBContext): Promise<User> {
        return await this.updateUserUC.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<void> {
        return await this.deleteUserUC.execute(id, dbOrTx);
    }
}

const getUsersService = (): UsersService => {
    const { container } = require("../../container");
    return (container as Container).get<UsersService>(TYPES.UsersService);
};

export const usersService = new Proxy({} as UsersService, {
    get: (_target, prop) => {
        const service = getUsersService();
        const value = (service as any)[prop];
        if (typeof value === 'function') {
            return value.bind(service);
        }
        return value;
    }
});

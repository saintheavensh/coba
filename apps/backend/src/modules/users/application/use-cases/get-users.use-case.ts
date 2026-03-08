import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { DBContext } from "../../../../shared/types/db-context";
import { IUserRepository, User } from "../../domain";
import { HTTPException } from "hono/http-exception";

@injectable()
export class GetUsersUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private readonly repository: IUserRepository
    ) { }

    async execute(role?: string, dbOrTx?: DBContext): Promise<User[]> {
        return await this.repository.findAll(role, dbOrTx);
    }
}

@injectable()
export class GetUserByIdUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private readonly repository: IUserRepository
    ) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<User> {
        const user = await this.repository.findById(id, dbOrTx);
        if (!user) {
            throw new HTTPException(404, { message: "User not found" });
        }
        return user;
    }
}

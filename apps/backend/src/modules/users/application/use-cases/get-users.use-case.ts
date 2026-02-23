import { DBContext } from "../../../../shared/types/db-context";
import { IUserRepository, User } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetUsersUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(role?: string, dbOrTx?: DBContext): Promise<User[]> {
        return await this.repository.findAll(role, dbOrTx);
    }
}

export class GetUserByIdUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<User> {
        const user = await this.repository.findById(id, dbOrTx);
        if (!user) {
            throw new HTTPException(404, { message: "User not found" });
        }
        return user;
    }
}

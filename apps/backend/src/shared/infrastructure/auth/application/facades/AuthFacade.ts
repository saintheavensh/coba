import { Result } from "../../../../core/Result";
import { LoginUseCase, LoginInput, LoginResult } from "../use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "../use-cases/GetCurrentUserUseCase";
import { GetRolesUseCase } from "../use-cases/GetRolesUseCase";
import { injectable, inject } from "inversify";
// Note: We'll use TYPES from a shared location if possible, or define them here for now
// For now, let's assume we use constructor injection if possible, or manual wire up in container.

@injectable()
export class AuthFacade {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
        private readonly getRolesUseCase: GetRolesUseCase
    ) { }

    async login(input: LoginInput): Promise<LoginResult> {
        return await this.loginUseCase.execute(input);
    }

    async getCurrentUser(id: string) {
        return await this.getCurrentUserUseCase.execute({ userId: id });
    }

    async getRoles() {
        return await this.getRolesUseCase.execute();
    }
}

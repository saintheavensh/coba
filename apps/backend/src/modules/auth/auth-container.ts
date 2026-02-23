/**
 * Wires auth ports to adapters and exposes use cases.
 * Single place to swap implementations (e.g. for testing).
 */
import { LoginUseCase, GetCurrentUserUseCase, GetRolesUseCase } from "./application";
import {
    UserRepositoryAdapter,
    BunPasswordVerifierAdapter,
    JwtTokenIssuerAdapter,
    RoleRepositoryAdapter
} from "./infrastructure";

// Repositories & Adapters
const userRepository = new UserRepositoryAdapter();
const passwordVerifier = new BunPasswordVerifierAdapter();
const tokenIssuer = new JwtTokenIssuerAdapter();
const roleRepository = new RoleRepositoryAdapter();

// Use Cases
export const loginUseCase = new LoginUseCase(userRepository, passwordVerifier, tokenIssuer);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
export const getRolesUseCase = new GetRolesUseCase(roleRepository);

/**
 * Auth Facade - Standard entry point for the module
 */
export class AuthFacade {
    async login(input: any) {
        return await loginUseCase.execute(input);
    }

    async getCurrentUser(input: any) {
        return await getCurrentUserUseCase.execute(input);
    }

    async getRoles() {
        return await getRolesUseCase.execute();
    }
}

export const authFacade = new AuthFacade();

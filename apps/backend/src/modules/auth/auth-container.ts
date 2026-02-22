/**
 * Wires auth ports to adapters and exposes use cases.
 * Single place to swap implementations (e.g. for testing).
 */
import { LoginUseCase, GetCurrentUserUseCase } from "./use-cases";
import { UserRepositoryAdapter, BunPasswordVerifierAdapter, JwtTokenIssuerAdapter } from "./adapters";

const userRepository = new UserRepositoryAdapter();
const passwordVerifier = new BunPasswordVerifierAdapter();
const tokenIssuer = new JwtTokenIssuerAdapter();

export const loginUseCase = new LoginUseCase(userRepository, passwordVerifier, tokenIssuer);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

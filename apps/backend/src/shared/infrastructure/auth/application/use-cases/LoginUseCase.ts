import type { IUserRepository, UserWithRoles, IPasswordService, ITokenService } from "../../domain";

const TOKEN_EXPIRY_DAYS = 7;

export interface LoginInput {
    username: string;
    password: string;
    dbOrTx?: unknown;
}

export interface LoginResult {
    user: Omit<UserWithRoles, "password" | "roles"> & { roles: string[] };
    token: string;
}

export class LoginUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordVerifier: IPasswordService,
        private readonly tokenIssuer: ITokenService
    ) { }

    async execute(input: LoginInput): Promise<LoginResult> {
        const user = await this.userRepository.findByUsername(input.username, input.dbOrTx);

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isMatch = await this.passwordVerifier.verify(input.password, user.password);
        if (!isMatch) {
            throw new Error("Invalid username or password");
        }

        const userRoles = (user as UserWithRoles).roles?.map((ur: { role: { id: string } }) => ur.role.id) ?? (user.role ? [user.role] : []);

        const payload = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: userRoles.includes("owner") ? "owner" : userRoles[0],
            roles: userRoles,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * TOKEN_EXPIRY_DAYS
        };

        const token = await this.tokenIssuer.sign(payload);

        const { password: _p, ...userWithoutPassword } = user;
        return {
            user: {
                ...userWithoutPassword,
                roles: userRoles
            },
            token
        };
    }
}

import type { ITokenService } from "../../domain";

export interface SwitchRoleInput {
    userPayload: any; // The current decoded JWT payload
    targetRoleId: string;
}

export interface SwitchRoleResult {
    token: string;
    role: string;
}

const TOKEN_EXPIRY_DAYS = 7;

export class SwitchRoleUseCase {
    constructor(private readonly tokenIssuer: ITokenService) { }

    async execute(input: SwitchRoleInput): Promise<SwitchRoleResult> {
        const { userPayload, targetRoleId } = input;
        const availableRoles: string[] = userPayload.roles || [];

        if (!availableRoles.includes(targetRoleId)) {
            throw new Error("Invalid target role");
        }

        const newPayload = {
            ...userPayload,
            role: targetRoleId,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * TOKEN_EXPIRY_DAYS
        };

        const token = await this.tokenIssuer.sign(newPayload);

        return { token, role: targetRoleId };
    }
}

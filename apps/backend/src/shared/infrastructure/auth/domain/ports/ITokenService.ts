/**
 * Port for issuing tokens. Use cases depend on this, not on Hono JWT.
 */

export interface TokenPayload {
    id: string;
    sid: string;
    username: string;
    name: string;
    role: string;
    roles: string[];
    exp: number;
}

export interface ITokenService {
    sign(payload: TokenPayload): Promise<string>;
}

/**
 * Port for issuing tokens. Use cases depend on this, not on Hono JWT.
 */

export interface TokenPayload {
    id: string;
    username: string;
    name: string;
    role: string;
    roles: string[];
    exp: number;
}

export interface ITokenIssuer {
    sign(payload: TokenPayload): Promise<string>;
}

import { sign } from "hono/jwt";
import type { ITokenIssuer, TokenPayload } from "../domain";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class JwtTokenIssuerAdapter implements ITokenIssuer {
    async sign(payload: TokenPayload): Promise<string> {
        return await sign(payload as unknown as Record<string, unknown>, JWT_SECRET);
    }
}

import { sign } from "hono/jwt";
import type { ITokenService, TokenPayload } from "../../domain";
import { appConfig } from "../../../config/AppConfig";

export class JwtTokenService implements ITokenService {
    async sign(payload: TokenPayload): Promise<string> {
        return await sign(payload as unknown as Record<string, unknown>, appConfig.jwtSecret);
    }
}

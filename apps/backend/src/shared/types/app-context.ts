import { Context, Input } from "hono";
import { User } from "../../modules/users/domain/entities/user.entity";

export interface AppVariables {
    user?: User;
    tenantId?: string;
    requestId?: string;
}

export type AppHonoContext<T extends Input = {}> = Context<{ Variables: AppVariables }, "/", T>;

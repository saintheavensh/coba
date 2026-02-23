import { Context } from "hono";
import { getRolesUseCase } from "../auth-container";
import { apiSuccess, apiError } from "../../../lib/response";

export class RoleController {
    async getAll(c: Context) {
        try {
            const roles = await getRolesUseCase.execute();
            return apiSuccess(c, roles, "Roles retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch roles", 500);
        }
    }
}

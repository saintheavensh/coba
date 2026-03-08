import { AppHonoContext } from "../../../shared/types/app-context";
import { UsersService } from "../users-container";
import { CreateUserData, UpdateUserData } from "../domain";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";
import { injectable, inject } from "inversify";
import { TYPES } from "../types";

@injectable()
export class UsersController {
    constructor(
        @inject(TYPES.UsersService) private readonly service: UsersService
    ) { }

    async getAll(c: AppHonoContext) {
        try {
            const role = c.req.query("role");
            const users = await this.service.findAll(role);
            return apiSuccess(c, users, "Users retrieved successfully");
        } catch (e: unknown) {
            console.error("[UsersController] GetAll Error:", e);
            return apiError(c as any, e, "Failed to retrieve users");
        }
    }

    async getById(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const user = await this.service.getById(id);
            return apiSuccess(c, user);
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to retrieve user");
        }
    }

    async create(c: AppHonoContext) {
        try {
            const data = await c.req.json() as CreateUserData;
            const user = await this.service.create(data);
            return apiSuccess(c, user, "User created successfully", 201);
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to create user");
        }
    }

    async update(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            const data = await c.req.json() as UpdateUserData;
            const user = await this.service.update(id, data);
            return apiSuccess(c, user, "User updated successfully");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to update user");
        }
    }

    async delete(c: AppHonoContext) {
        try {
            const id = c.req.param("id")!;
            await this.service.delete(id);
            return apiSuccess(c, null, "User deleted successfully");
        } catch (e: unknown) {
            return apiError(c as any, e, "Failed to delete user");
        }
    }
}

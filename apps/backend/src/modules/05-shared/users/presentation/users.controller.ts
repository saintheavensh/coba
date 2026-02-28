import { Context } from "hono";
import { usersService, UsersService } from "../users-container";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

export class UsersController {
    constructor(private readonly service: UsersService = usersService) { }

    async getAll(c: Context) {
        try {
            const role = c.req.query("role");
            const users = await this.service.findAll(role);
            return apiSuccess(c, users, "Users retrieved successfully");
        } catch (e: any) {
            console.error("[UsersController] GetAll Error:", e);
            return apiError(c, e.message || String(e));
        }
    }

    async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const user = await this.service.getById(id);
            return apiSuccess(c, user);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to retrieve user", status);
        }
    }

    async create(c: Context) {
        try {
            const data = await c.req.json();
            const user = await this.service.create(data);
            return apiSuccess(c, user, "User created successfully", 201);
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to create user", status);
        }
    }

    async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await c.req.json();
            const user = await this.service.update(id, data);
            return apiSuccess(c, user, "User updated successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to update user", status);
        }
    }

    async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await this.service.delete(id);
            return apiSuccess(c, null, "User deleted successfully");
        } catch (e: any) {
            const status = e.status || 500;
            return apiError(c, e, e.message || "Failed to delete user", status);
        }
    }
}

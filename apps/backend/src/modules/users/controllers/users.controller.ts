import { Context } from "hono";
import { UsersService } from "../services/users.service";
import { apiSuccess, apiError } from "../../../lib/response"; // Corrected path to lib

const service = new UsersService();

export class UsersController {
    static async getAll(c: Context) {
        try {
            const role = c.req.query("role");
            const users = await service.findAll(role);
            return apiSuccess(c, users, "Users retrieved successfully");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id");
            const user = await service.getById(id);
            if (!user) return apiError(c, null, "User not found", 404);
            return apiSuccess(c, user);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async create(c: Context) {
        try {
            const data = await c.req.json();
            const user = await service.create(data);
            return apiSuccess(c, user, "User created successfully", 201);
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await c.req.json();
            const user = await service.update(id, data);
            return apiSuccess(c, user, "User updated successfully");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id");
            await service.delete(id);
            return apiSuccess(c, null, "User deleted successfully");
        } catch (e: any) {
            return apiError(c, e.message || String(e));
        }
    }
}

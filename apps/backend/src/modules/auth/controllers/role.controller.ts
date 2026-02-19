import { Context } from "hono";
import { RoleModel } from "../models/role.model";

export class RoleController {
    static async getAll(c: Context) {
        try {
            const roles = await RoleModel.findAll();
            return c.json({ data: roles });
        } catch (e: any) {
            return c.json({ error: e.message }, 500);
        }
    }
}

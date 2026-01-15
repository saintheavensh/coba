// Users Controller
import { Hono } from "hono";
import { UsersService } from "./users.service";
import { apiSuccess, apiError } from "../../lib/response";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new UsersService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const role = c.req.query("role");
    try {
        const users = await service.findAll(role);
        return apiSuccess(c, users, "Users retrieved successfully");
    } catch (e) {
        return apiError(c, String(e));
    }
});

export default app;

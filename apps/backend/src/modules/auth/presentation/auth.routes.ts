import { Hono } from "hono";
import { AuthController } from "./auth.controller";
import { RoleController } from "./role.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new AuthController();

app.post("/login", (c) => controller.login(c));
app.post("/logout", (c) => controller.logout(c));
app.get("/me", authMiddleware, (c) => controller.me(c));
app.get("/roles", authMiddleware, (c) => RoleController.getAll(c));

export default app;

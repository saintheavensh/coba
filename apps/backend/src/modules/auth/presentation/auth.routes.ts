import { Hono } from "hono";
import { AuthController } from "./auth.controller";
import { RoleController } from "./role.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const authController = new AuthController();
const roleController = new RoleController();

app.post("/login", (c) => authController.login(c));
app.post("/logout", (c) => authController.logout(c));
app.get("/me", authMiddleware, (c) => authController.me(c));
app.get("/roles", authMiddleware, (c) => roleController.getAll(c));

export default app;

import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const app = new Hono();
const controller = new AuthController();

app.post("/login", (c) => controller.login(c));
app.post("/logout", (c) => controller.logout(c));
app.get("/me", authMiddleware, (c) => controller.me(c));

export default app;

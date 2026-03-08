import { Hono } from "hono";
import { AppVariables } from "../../../shared/types/app-context";
import { UsersController } from "./users.controller";
import { usersService } from "../users-container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const app = new Hono<{ Variables: AppVariables }>();
const controller = new UsersController(usersService as any);

app.use("*", authMiddleware);

app.get("/", requirePermission("employee.manage"), (c) => controller.getAll(c));
app.get("/:id", requirePermission("employee.manage"), (c) => controller.getById(c));
app.post("/", requirePermission("employee.manage"), (c) => controller.create(c));
app.put("/:id", requirePermission("employee.manage"), (c) => controller.update(c));
app.delete("/:id", requirePermission("employee.manage"), (c) => controller.delete(c));

export default app;

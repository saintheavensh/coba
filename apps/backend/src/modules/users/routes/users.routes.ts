import { Hono } from "hono";
import { UsersController } from "../controllers/users.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const users = new Hono();

users.use("*", authMiddleware);
users.use("*", requirePermission("employee.manage"));
users.get("/", UsersController.getAll);
users.get("/:id", UsersController.getById);
users.post("/", UsersController.create);
users.put("/:id", UsersController.update);
users.delete("/:id", UsersController.delete);

export default users;

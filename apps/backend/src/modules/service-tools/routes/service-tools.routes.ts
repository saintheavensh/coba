import { Hono } from "hono";
import { ServiceToolsController } from "../controllers/service-tools.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

export const serviceTools = new Hono();

serviceTools.use("*", authMiddleware);

serviceTools.get("/", ServiceToolsController.getAll);
serviceTools.get("/my", ServiceToolsController.getMyTools);
serviceTools.get("/requests/my", ServiceToolsController.getMyRequests);
serviceTools.get("/requests/all", ServiceToolsController.getAllRequests);
serviceTools.patch("/requests/:id/status", authMiddleware, ServiceToolsController.updateRequestStatus);
serviceTools.post("/requests", ServiceToolsController.createRequest);

serviceTools.post("/", ServiceToolsController.create);
serviceTools.put("/:id", ServiceToolsController.update);
serviceTools.patch("/:id/condition", ServiceToolsController.updateCondition);
serviceTools.delete("/:id", ServiceToolsController.delete);

export default serviceTools;

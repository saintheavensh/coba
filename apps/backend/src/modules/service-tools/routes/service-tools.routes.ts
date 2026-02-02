import { Hono } from "hono";
import { ServiceToolsController } from "../controllers/service-tools.controller";

export const serviceTools = new Hono();

serviceTools.get("/", ServiceToolsController.getAll);
serviceTools.post("/", ServiceToolsController.create);
serviceTools.put("/:id", ServiceToolsController.update);
serviceTools.delete("/:id", ServiceToolsController.delete);

export default serviceTools;

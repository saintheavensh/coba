import { Hono } from "hono";
import { ServiceToolsService } from "./service-tools.service";

export const serviceToolsController = new Hono();
const service = new ServiceToolsService();

serviceToolsController.get("/", async (c) => {
    const tools = await service.getAll();
    return c.json(tools);
});

serviceToolsController.post("/", async (c) => {
    const body = await c.req.json();
    const result = await service.create(body);
    return c.json(result);
});

serviceToolsController.put("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const result = await service.update(id, body);
    return c.json(result);
});

serviceToolsController.delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await service.delete(id);
    return c.json(result);
});

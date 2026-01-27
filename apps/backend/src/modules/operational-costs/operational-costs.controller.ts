import { Hono } from "hono";
import { OperationalCostsService } from "./operational-costs.service";

export const operationalCostsController = new Hono();
const service = new OperationalCostsService();

operationalCostsController.get("/", async (c) => {
    const items = await service.getAll();
    return c.json(items);
});

operationalCostsController.post("/", async (c) => {
    const body = await c.req.json();
    // Assuming authentication middleware populates user, but for now passing body directly
    // Ideally extract user ID from c.get('jwtPayload') or similar if implemented
    const result = await service.create(body);
    return c.json(result);
});

operationalCostsController.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await service.delete(id);
    return c.json(result);
});

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createServiceSchema, updateStatusSchema } from "@repo/shared";
import { ServiceService } from "./service.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();
const service = new ServiceService();

app.use("*", authMiddleware);

app.get("/", async (c) => {
    const list = await service.getAll();
    return c.json(list);
});

app.get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ message: "Invalid ID" }, 400);
    const item = await service.getById(id);
    if (!item) return c.json({ message: "Not found" }, 404);
    return c.json(item);
});

app.post("/", zValidator("json", createServiceSchema), async (c) => {
    const data = c.req.valid("json");
    // const user = c.get("user");
    // data.userId = user.id;
    try {
        const result = await service.createService(data, "USR-000"); // TODO: Use real user
        return c.json(result);
    } catch (e) {
        return c.json({ message: String(e) }, 400);
    }
});

app.put("/:id/status", zValidator("json", updateStatusSchema), async (c) => {
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");
    try {
        await service.updateStatus(id, data, data.userId);
        return c.json({ message: "Status updated" });
    } catch (e) {
        return c.json({ message: String(e) }, 400);
    }
});

export default app;

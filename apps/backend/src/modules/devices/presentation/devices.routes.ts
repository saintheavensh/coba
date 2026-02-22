import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { DevicesController } from "./devices.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { permissionGuard } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new DevicesController();

const deviceSchema = z.object({
    brand: z.string().min(1),
    series: z.string().optional().nullable(),
    model: z.string().min(1),
    code: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    colors: z.array(z.string()).optional().nullable(),
    specs: z.string().optional().nullable(),
    chipset: z.string().optional().nullable(),
    specifications: z.record(z.any()).optional().nullable(),
});

app.post("/scrape", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.scrape(c));
app.post("/scrape-list", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.scrapeList(c));
app.post("/import-url", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.importUrl(c));
app.get("/", (c) => controller.getAll(c));
app.get("/unlinked", authMiddleware, permissionGuard("inventory.view"), (c) => controller.getUnlinked(c));
app.get("/:id", (c) => controller.getById(c));
app.post("/", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", deviceSchema), (c) => controller.create(c));
app.patch("/:id", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", deviceSchema.partial()), (c) => controller.update(c));
app.post("/bulk-delete", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.bulkDelete(c));
app.post("/:id/sync", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.sync(c));
app.delete("/:id", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.delete(c));

export default app;

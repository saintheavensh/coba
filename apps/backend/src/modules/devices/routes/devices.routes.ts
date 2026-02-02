import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { DevicesController } from "../controllers/devices.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { permissionGuard } from "../../../middlewares/permission.middleware";

const app = new Hono();
const controller = new DevicesController();

const deviceSchema = z.object({
    brand: z.string().min(1),
    series: z.string().optional(),
    model: z.string().min(1),
    code: z.string().optional(),
    image: z.string().optional(),
    colors: z.array(z.string()).optional(),
    specs: z.string().optional(),
    chipset: z.string().optional(),
    specifications: z.record(z.any()).optional(),
});

app.post("/scrape", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.scrape(c));
app.post("/scrape-list", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.scrapeList(c));
app.post("/import-url", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.importUrl(c));
app.get("/", (c) => controller.getAll(c));
app.get("/:id", (c) => controller.getById(c));
app.post("/", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", deviceSchema), (c) => controller.create(c));
app.patch("/:id", authMiddleware, permissionGuard("inventory.manage"), zValidator("json", deviceSchema.partial()), (c) => controller.update(c));
app.post("/bulk-delete", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.bulkDelete(c));
app.delete("/:id", authMiddleware, permissionGuard("inventory.manage"), (c) => controller.delete(c));

export default app;

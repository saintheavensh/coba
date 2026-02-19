import { Hono } from "hono";
import { DefectiveItemsController } from "../controllers/defective-items.controller";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";

const defectiveItems = new Hono();

defectiveItems.use("*", authMiddleware);
defectiveItems.use("*", requirePermission("inventory.manage"));

// GET /defective-items (Pending List)
defectiveItems.get("/", DefectiveItemsController.getPendingItems);

// POST /defective-items (Manual Add)
defectiveItems.post(
    "/",
    zValidator(
        "json",
        z.object({
            productId: z.string(),
            batchId: z.string(),
            qty: z.coerce.number(),
            reason: z.string(),
        })
    ),
    DefectiveItemsController.addItem
);

// POST /defective-items/create-return (Execute)
defectiveItems.post(
    "/create-return",
    zValidator(
        "json",
        z.object({
            userId: z.string(),
            itemIds: z.array(z.string())
        })
    ),
    DefectiveItemsController.createReturn
);

export default defectiveItems;

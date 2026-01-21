import { Hono } from "hono";
import { DefectiveItemsService } from "./defective-items.service";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { apiSuccess } from "../../lib/response";

export const defectiveItemsController = new Hono();
const service = new DefectiveItemsService();

// GET /defective-items (Pending List)
defectiveItemsController.get("/", async (c) => {
    const data = await service.getPendingItems();
    return apiSuccess(c, data);
});

// POST /defective-items (Manual Add)
defectiveItemsController.post(
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
    async (c) => {
        const body = c.req.valid("json");
        const result = await service.addItem({
            ...body,
            source: "manual"
        });
        return apiSuccess(c, result);
    }
);

// POST /defective-items/create-return (Execute)
defectiveItemsController.post(
    "/create-return",
    zValidator(
        "json",
        z.object({
            userId: z.string(),
            itemIds: z.array(z.string())
        })
    ),
    async (c) => {
        const body = c.req.valid("json");
        const result = await service.createReturnFromItems(body.userId, body.itemIds);
        return apiSuccess(c, result);
    }
);

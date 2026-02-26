import { Hono } from "hono";
import { approvalsService } from "../approvals-container";

const app = new Hono();

// List all pending approvals
app.get("/pending", async (c) => {
    const list = await approvalsService.getPending();
    return c.json({ data: list });
});

// Request approval manually if needed
app.post("/request", async (c) => {
    const body = await c.req.json();
    const result = await approvalsService.requestApproval(body);
    return c.json({ data: result });
});

// Approve/Reject approval
app.post("/:id/action", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const result = await approvalsService.approve({
        approvalId: id,
        ...body
    });
    return c.json({ data: result });
});

export default app;

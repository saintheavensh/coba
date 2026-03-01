import { Hono } from "hono";
import { approvalsService } from "../approvals-container";
import { authMiddleware } from "../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";

const app = new Hono();

app.use("*", authMiddleware);

// GET /approvals/pending — List all pending approvals
app.get("/pending", async (c) => {
    try {
        const list = await approvalsService.getPending();
        return apiSuccess(c, list, "Pending approvals retrieved");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve pending approvals");
    }
});

// GET /approvals/history — List completed/rejected approvals
app.get("/history", async (c) => {
    try {
        const type = c.req.query("type") || undefined;
        const status = c.req.query("status") || undefined;
        const list = await approvalsService.getHistory({ type, status });
        return apiSuccess(c, list, "Approval history retrieved");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve approval history");
    }
});

// GET /approvals/stats — Get approval statistics
app.get("/stats", async (c) => {
    try {
        const stats = await approvalsService.getStats();
        return apiSuccess(c, stats, "Approval stats retrieved");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve approval stats");
    }
});

// GET /approvals/:id — Get approval detail
app.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const approval = await approvalsService.getById(id);
        if (!approval) {
            return apiError(c, new Error("Approval not found"), "Approval not found", 404);
        }
        return apiSuccess(c, approval, "Approval detail retrieved");
    } catch (e: any) {
        return apiError(c, e, "Failed to retrieve approval detail");
    }
});

// POST /approvals/request — Request a new approval
app.post("/request", async (c) => {
    try {
        const body = await c.req.json();
        const result = await approvalsService.requestApproval(body);
        return apiSuccess(c, result, "Approval requested", 201);
    } catch (e: any) {
        return apiError(c, e, e.message || "Failed to request approval");
    }
});

// POST /approvals/:id/approve — Approve an approval
app.post("/:id/approve", async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const result = await approvalsService.approve({
            approvalId: id,
            ...body,
        });
        return apiSuccess(c, result, "Approval approved");
    } catch (e: any) {
        return apiError(c, e, e.message || "Failed to approve");
    }
});

// POST /approvals/:id/reject — Reject an approval
app.post("/:id/reject", async (c) => {
    try {
        const id = c.req.param("id");
        const { reason } = await c.req.json();
        const result = await approvalsService.reject(id, reason);
        return apiSuccess(c, result, "Approval rejected");
    } catch (e: any) {
        return apiError(c, e, e.message || "Failed to reject");
    }
});

// POST /approvals/:id/action — Generic action (legacy support)
app.post("/:id/action", async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const result = await approvalsService.approve({
            approvalId: id,
            ...body,
        });
        return apiSuccess(c, result, "Action performed");
    } catch (e: any) {
        return apiError(c, e, e.message || "Failed to perform action");
    }
});

export default app;

import { Context } from "hono";
import { ManageCommissionUseCase } from "../application/use-cases/manage-commission.use-case";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class CommissionController {
    constructor(private readonly useCase: ManageCommissionUseCase) { }

    async getSettings(c: Context) {
        try {
            const technicianId = c.req.param("technicianId");
            const result = await this.useCase.getSettings(technicianId);
            return apiSuccess(c, result, undefined);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission settings");
        }
    }

    async upsertSettings(c: Context) {
        try {
            const technicianId = c.req.param("technicianId");
            const body = await c.req.json();
            const result = await this.useCase.upsertSettings(technicianId, body);
            return apiSuccess(c, result, "Commission settings updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update commission settings");
        }
    }

    async getSummary(c: Context) {
        try {
            const technicianId = c.req.param("technicianId");
            const start = c.req.query("startDate");
            const end = c.req.query("endDate");

            const startDate = start ? new Date(start) : undefined;
            const endDate = end ? new Date(end) : undefined;

            const result = await this.useCase.getSummary(technicianId, startDate, endDate);
            return apiSuccess(c, result, undefined);
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve commission summary");
        }
    }

    async markAsPaid(c: Context) {
        try {
            const body = await c.req.json();
            if (!Array.isArray(body.ids)) {
                return apiError(c, "Invalid input, expected an array of 'ids'", "Validation Error", 400);
            }
            const result = await this.useCase.markAsPaid(body.ids);
            return apiSuccess(c, result, "Commissions marked as paid");
        } catch (e: any) {
            return apiError(c, e, "Failed to mark commissions as paid");
        }
    }
}

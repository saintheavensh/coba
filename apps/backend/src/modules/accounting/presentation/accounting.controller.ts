import { Context } from "hono";
import { accountingService, AccountingService } from "../accounting-container";
import { apiSuccess, apiError } from "../../../shared/application/middlewares/ResponseHelpers";

export class AccountingController {
    constructor(
        private readonly service: AccountingService = accountingService
    ) { }

    // Accounts
    async getAllAccounts(c: Context) {
        try {
            const { typeId } = c.req.query();
            const accounts = await this.service.getAllAccounts({ typeId });
            return apiSuccess(c, accounts, "Accounts retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve accounts");
        }
    }

    async getAccountTree(c: Context) {
        try {
            const { typeId } = c.req.query();
            const tree = await this.service.getAccountTree({ typeId });
            return apiSuccess(c, tree, "Account tree retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account tree");
        }
    }

    async getAccountTypes(c: Context) {
        try {
            const types = await this.service.getAccountTypes();
            return apiSuccess(c, types, "Account types retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve account types");
        }
    }

    async createAccount(c: Context) {
        try {
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.createAccount(body, userId);
            return apiSuccess(c, { id }, "Account created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create account");
        }
    }

    async updateAccount(c: Context) {
        try {
            const id = c.req.param("id");
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.updateAccount(id, body, userId);
            return apiSuccess(c, null, "Account updated successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to update account");
        }
    }

    async deleteAccount(c: Context) {
        try {
            const id = c.req.param("id");
            const userId = c.get("user")?.id;
            await this.service.deleteAccount(id, userId);
            return apiSuccess(c, null, "Account deleted successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to delete account");
        }
    }

    // Journals
    async getAllJournals(c: Context) {
        try {
            const filters = c.req.query();
            const journals = await this.service.getAllJournals(filters);
            return apiSuccess(c, journals, "Journals retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journals");
        }
    }

    async getJournalById(c: Context) {
        try {
            const id = c.req.param("id");
            const journal = await this.service.getJournalById(id);
            if (!journal) return apiError(c, null, "Journal not found", 404);
            return apiSuccess(c, journal, "Journal retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve journal");
        }
    }

    // Cash Register
    async getCurrentRegister(c: Context) {
        try {
            const register = await this.service.getCurrentRegister();
            return apiSuccess(c, register, "Current register status retrieved");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve register status");
        }
    }

    async openRegister(c: Context) {
        try {
            const { openingBalance } = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.openRegister(openingBalance, userId);
            return apiSuccess(c, { id }, "Register opened successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to open register");
        }
    }

    async closeRegister(c: Context) {
        try {
            const { actualClosing, notes, reservation } = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.closeRegister(actualClosing, notes, userId, reservation);
            return apiSuccess(c, null, "Register closed successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to close register");
        }
    }

    async recordExpense(c: Context) {
        try {
            const { amount, category, description, userRoles } = await c.req.json();
            const userId = c.get("user")?.id;
            await this.service.recordCashExpense(amount, category, description, userId, userRoles);
            return apiSuccess(c, null, "Expense recorded successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to record expense");
        }
    }

    // Assets
    async getAllAssets(c: Context) {
        try {
            const assets = await this.service.getAllAssets();
            return apiSuccess(c, assets, "Assets retrieved successfully");
        } catch (e: any) {
            return apiError(c, e, "Failed to retrieve assets");
        }
    }

    async createAsset(c: Context) {
        try {
            const body = await c.req.json();
            const userId = c.get("user")?.id;
            const id = await this.service.createAsset(body, userId);
            return apiSuccess(c, { id }, "Asset created successfully", 201);
        } catch (e: any) {
            return apiError(c, e, "Failed to create asset");
        }
    }
}

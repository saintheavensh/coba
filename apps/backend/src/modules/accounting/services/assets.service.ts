import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { db } from "../../../db";
import { assets, assetDepreciationLogs } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { AccountingService } from "../services";

export interface CreateAssetInput {
    name: string;
    category: "tool" | "equipment" | "furniture" | "vehicle" | "building" | "land" | "other";
    purchaseDate: Date;
    purchaseCost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    accountId?: string;
    depreciationAccountId?: string;
    notes?: string;
    sourceAccountId?: string; // Account to credit (Cash/Bank/Payable)
}

export interface AssetFilters {
    category?: string;
    status?: "active" | "disposed" | "fully_depreciated";
    limit?: number;
    offset?: number;
}

@injectable()
export class AssetsService {
    constructor(
        @inject(TYPES.AccountingService) private readonly accountingService: AccountingService
    ) { }
    /**
     * Calculate monthly depreciation (straight-line method)
     */
    static calculateMonthlyDepreciation(purchaseCost: number, salvageValue: number, usefulLifeMonths: number): number {
        if (usefulLifeMonths <= 0) return 0;
        return Math.floor((purchaseCost - salvageValue) / usefulLifeMonths);
    }

    /**
     * Calculate tool cost per hour
     */
    public calculateToolCostPerHour(monthlyDepreciation: number, workingHoursPerMonth: number = 160): number {
        if (workingHoursPerMonth <= 0) return 0;
        return Math.ceil(monthlyDepreciation / workingHoursPerMonth);
    }

    /**
     * Create a new asset
     */
    public async create(input: CreateAssetInput, _userId?: string): Promise<string> {
        const result = await this.accountingService.createAsset(input, _userId || "");
        return result.id;
    }

    /**
     * Get all assets
     */
    public async getAll(filters: AssetFilters = {}) {
        const assetsList = await this.accountingService.getAllAssets();
        // Simple filtering for legacy service
        return assetsList.filter((a: any) => {
            if (filters.category && a.category !== filters.category) return false;
            if (filters.status && a.status !== filters.status) return false;
            return true;
        });
    }

    /**
     * Get asset by ID with depreciation history
     */
    public async getById(id: string) {
        const asset = await this.accountingService.getAssetById(id);
        if (!asset) return null;

        const depreciationHistory = await db
            .select()
            .from(assetDepreciationLogs)
            .where(eq(assetDepreciationLogs.assetId, id))
            .orderBy(desc(assetDepreciationLogs.period));

        return {
            ...asset,
            toolCostPerHour: this.calculateToolCostPerHour(asset.monthlyDepreciation),
            depreciationHistory,
        };
    }

    /**
     * Get total monthly depreciation for all active assets
     */
    public async getTotalMonthlyDepreciation(): Promise<number> {
        const assetsList = await this.accountingService.getAllAssets();
        return assetsList
            .filter((a: any) => a.status === "active")
            .reduce((sum: number, a: any) => sum + (a.monthlyDepreciation || 0), 0);
    }

    /**
     * Dispose an asset
     */
    public async dispose(id: string, reason: string, _userId?: string): Promise<void> {
        const asset = await this.getById(id);
        if (!asset) throw new Error(`Asset ${id} not found`);

        await db
            .update(assets)
            .set({
                status: "disposed",
                updatedAt: new Date(),
                notes: `${asset.notes || ""}\n[DISPOSED] ${reason}`,
            })
            .where(eq(assets.id, id));
    }

    /**
     * Delete an asset
     */
    public async delete(id: string, _userId?: string): Promise<void> {
        await this.accountingService.deleteAccount(id, _userId);
        throw new Error("Deletion not implemented in refactored service yet");
    }
}

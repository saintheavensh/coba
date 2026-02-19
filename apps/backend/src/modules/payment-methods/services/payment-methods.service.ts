import { db } from "../../../db";
import { accounts, paymentMethods, paymentVariants } from "../../../db/schema";
import { eq, like, desc, and } from "drizzle-orm";
import { PaymentMethodsModel } from "../models/payment-methods.model";

export interface PaymentMethodInput {
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    accountId?: string;
    feeConfig?: {
        enabled: boolean;
        type: "percent" | "fixed";
        value: number;
    };
}

export interface PaymentVariantInput {
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    accountId?: string;
}

export class PaymentMethodsService {
    private model: PaymentMethodsModel;

    constructor() {
        this.model = new PaymentMethodsModel();
    }

    // Get all payment methods with their variants
    async getAll() {
        return await this.model.findAll();
    }

    // Get only enabled methods with enabled variants
    async getEnabled() {
        return await this.model.findEnabled();
    }

    // Get a single method by ID
    async getById(id: string) {
        return await this.model.findById(id);
    }

    /**
     * Ensures an account exists in COA for this payment method/variant.
     * Logic:
     * 1. If accountId provided, verify it.
     * 2. If not, try to find an account named similarly under "Kas & Bank" (1-1000).
     * 3. If not found, create one with the next available code.
     */
    private async ensureAccount(name: string, type: string, providedAccountId?: string): Promise<string> {
        if (providedAccountId) return providedAccountId;

        const parentId = "1-1000"; // Kas & Bank
        const prefix = "10"; // Base for 10xx codes

        // Try searching by name first
        const existing = await db.query.accounts.findFirst({
            where: and(
                eq(accounts.parentId, parentId),
                eq(accounts.name, name)
            )
        });

        if (existing) return existing.id;

        // Create new account
        // Find next code in 10xx range
        const lastAccount = await db.query.accounts.findFirst({
            where: like(accounts.code, `${prefix}%`),
            orderBy: [desc(accounts.code)]
        });

        const nextNum = lastAccount ? (parseInt(lastAccount.code) + 1) : 1001;
        const nextCode = nextNum.toString();
        const nextId = `1-${nextCode}`;

        await db.insert(accounts).values({
            id: nextId,
            code: nextCode,
            name: name,
            typeId: "ASSET",
            parentId: parentId,
            isActive: true,
            balance: 0
        });

        return nextId;
    }

    // Create a new payment method
    async create(input: PaymentMethodInput) {
        const id = `PM-${Date.now()}`;

        // Auto-link or create account
        const accountId = await this.ensureAccount(input.name, input.type, input.accountId);

        return await this.model.create({
            id,
            name: input.name,
            type: input.type,
            icon: input.icon,
            accountId,
            feeConfig: input.feeConfig,
            enabled: true,
        });
    }

    // Update a payment method
    async update(id: string, data: Partial<PaymentMethodInput & { enabled: boolean }>) {
        return await this.model.update(id, data);
    }

    // Soft delete (disable) a payment method
    async disable(id: string) {
        await this.model.update(id, { enabled: false });
        return { success: true };
    }

    // Add a variant to a method
    async addVariant(methodId: string, input: PaymentVariantInput) {
        const id = `PV-${Date.now()}`;

        // Auto-link or create account for variant (e.g. Bank BCA - Rekening Utama)
        const accountId = await this.ensureAccount(input.name, "transfer", input.accountId);

        await this.model.createVariant({
            id,
            methodId,
            name: input.name,
            accountNumber: input.accountNumber,
            accountHolder: input.accountHolder,
            accountId,
            enabled: true,
        });
        return this.getById(methodId);
    }

    // Update a variant
    async updateVariant(variantId: string, data: Partial<PaymentVariantInput & { enabled: boolean }>) {
        await this.model.updateVariant(variantId, data);
    }

    // Soft delete (disable) a variant
    async disableVariant(variantId: string) {
        await this.model.updateVariant(variantId, { enabled: false });
        return { success: true };
    }
}


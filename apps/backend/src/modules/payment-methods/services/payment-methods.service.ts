import { PaymentMethodsModel } from "../models/payment-methods.model";

export interface PaymentMethodInput {
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
}

export interface PaymentVariantInput {
    name: string;
    accountNumber?: string;
    accountHolder?: string;
}

export class PaymentMethodsService {
    private model: PaymentMethodsModel;

    constructor() {
        this.model = new PaymentMethodsModel();
        // this.seedDefaults(); // seeding should probably be explicit or in a seed script, but keeping constructor behavior often triggers race conditions.
        // Moving seed call to explicit init or check.
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

    // Create a new payment method
    async create(input: PaymentMethodInput) {
        const id = `PM-${Date.now()}`;
        return await this.model.create({
            id,
            name: input.name,
            type: input.type,
            icon: input.icon,
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
        await this.model.createVariant({
            id,
            methodId,
            name: input.name,
            accountNumber: input.accountNumber,
            accountHolder: input.accountHolder,
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


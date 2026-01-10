import { db } from "../../db";
import { paymentMethods, paymentVariants } from "../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

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
    // Get all payment methods with their variants
    async getAll() {
        return db.query.paymentMethods.findMany({
            with: { variants: true },
            orderBy: (pm, { asc }) => [asc(pm.createdAt)],
        });
    }

    // Get only enabled methods with enabled variants
    async getEnabled() {
        const methods = await db.query.paymentMethods.findMany({
            where: eq(paymentMethods.enabled, true),
            with: {
                variants: {
                    where: eq(paymentVariants.enabled, true),
                },
            },
            orderBy: (pm, { asc }) => [asc(pm.createdAt)],
        });
        return methods;
    }

    // Get a single method by ID
    async getById(id: string) {
        return db.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, id),
            with: { variants: true },
        });
    }

    // Create a new payment method
    async create(input: PaymentMethodInput) {
        const id = `PM-${Date.now()}`;
        await db.insert(paymentMethods).values({
            id,
            name: input.name,
            type: input.type,
            icon: input.icon,
            enabled: true,
        });
        return this.getById(id);
    }

    // Update a payment method
    async update(id: string, data: Partial<PaymentMethodInput & { enabled: boolean }>) {
        await db.update(paymentMethods)
            .set(data)
            .where(eq(paymentMethods.id, id));
        return this.getById(id);
    }

    // Soft delete (disable) a payment method
    async disable(id: string) {
        await db.update(paymentMethods)
            .set({ enabled: false })
            .where(eq(paymentMethods.id, id));
        return { success: true };
    }

    // Add a variant to a method
    async addVariant(methodId: string, input: PaymentVariantInput) {
        const id = `PV-${Date.now()}`;
        await db.insert(paymentVariants).values({
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
        await db.update(paymentVariants)
            .set(data)
            .where(eq(paymentVariants.id, variantId));
    }

    // Soft delete (disable) a variant
    async disableVariant(variantId: string) {
        await db.update(paymentVariants)
            .set({ enabled: false })
            .where(eq(paymentVariants.id, variantId));
        return { success: true };
    }

    // Seed default payment methods if none exist
    async seedDefaults() {
        const existing = await db.query.paymentMethods.findFirst();
        if (existing) return; // Already seeded

        const defaults = [
            { id: "PM-cash", name: "Tunai", type: "cash" as const, icon: "💵" },
            { id: "PM-transfer", name: "Transfer Bank", type: "transfer" as const, icon: "🏦" },
            { id: "PM-qris", name: "QRIS", type: "qris" as const, icon: "📱" },
        ];

        for (const pm of defaults) {
            await db.insert(paymentMethods).values({
                ...pm,
                enabled: true,
            });
        }
    }
}

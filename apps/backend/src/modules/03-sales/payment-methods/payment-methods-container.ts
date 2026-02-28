import { db } from "../../../shared/infrastructure/database/client";
import { PaymentMethodRepositoryAdapter, AccountGatewayAdapter } from "./infrastructure";
import {
    GetPaymentMethodsUseCase,
    GetPaymentMethodByIdUseCase,
    CreatePaymentMethodUseCase,
    MutatePaymentMethodUseCase,
    VariantManagementUseCase
} from "./application";
import { PaymentMethod, PaymentMethodInput, PaymentVariantInput } from "./domain";

// Infrastructure adapters
const repository = new PaymentMethodRepositoryAdapter();
const accountGateway = new AccountGatewayAdapter();

// Use cases
const getPaymentMethodsUC = new GetPaymentMethodsUseCase(repository);
const getPaymentMethodByIdUC = new GetPaymentMethodByIdUseCase(repository);
const createPaymentMethodUC = new CreatePaymentMethodUseCase(repository, accountGateway, db as any);
const mutatePaymentMethodUC = new MutatePaymentMethodUseCase(repository);
const variantManagementUC = new VariantManagementUseCase(repository, accountGateway, db as any);

/**
 * PaymentMethodsService — facade for external and presentation layers.
 */
export class PaymentMethodsService {
    async getAll(): Promise<PaymentMethod[]> {
        return await getPaymentMethodsUC.execute(false);
    }

    async getEnabled(): Promise<PaymentMethod[]> {
        return await getPaymentMethodsUC.execute(true);
    }

    async getById(id: string): Promise<PaymentMethod> {
        return await getPaymentMethodByIdUC.execute(id);
    }

    async create(input: PaymentMethodInput): Promise<PaymentMethod> {
        return await createPaymentMethodUC.execute(input);
    }

    async update(id: string, data: any): Promise<PaymentMethod> {
        return await mutatePaymentMethodUC.execute(id, data);
    }

    async disable(id: string): Promise<void> {
        return await mutatePaymentMethodUC.disable(id);
    }

    async addVariant(methodId: string, input: PaymentVariantInput): Promise<PaymentMethod> {
        return await variantManagementUC.addVariant(methodId, input);
    }

    async updateVariant(variantId: string, data: any): Promise<void> {
        return await variantManagementUC.updateVariant(variantId, data);
    }

    async disableVariant(variantId: string): Promise<void> {
        return await variantManagementUC.disableVariant(variantId);
    }
}

/** Singleton service instance */
export const paymentMethodsService = new PaymentMethodsService();

import { DBContext } from "../../../../../shared/types/db-context";
import { PaymentMethod } from "../entities/payment-method.entity";

export interface IPaymentMethodRepository {
    findAll(dbOrTx?: DBContext): Promise<PaymentMethod[]>;
    findEnabled(dbOrTx?: DBContext): Promise<PaymentMethod[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<PaymentMethod | null>;
    create(data: any, dbOrTx?: DBContext): Promise<PaymentMethod>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<PaymentMethod>;

    // Variants
    createVariant(data: any, dbOrTx?: DBContext): Promise<void>;
    updateVariant(id: string, data: any, dbOrTx?: DBContext): Promise<void>;
    findVariantById(id: string, dbOrTx?: DBContext): Promise<any>;
}

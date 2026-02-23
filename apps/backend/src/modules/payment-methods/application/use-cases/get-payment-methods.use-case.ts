import { DBContext } from "../../../../shared/types/db-context";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetPaymentMethodsUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(enabledOnly: boolean = false, dbOrTx?: DBContext): Promise<PaymentMethod[]> {
        if (enabledOnly) {
            return await this.repository.findEnabled(dbOrTx);
        }
        return await this.repository.findAll(dbOrTx);
    }
}

export class GetPaymentMethodByIdUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<PaymentMethod> {
        const pm = await this.repository.findById(id, dbOrTx);
        if (!pm) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }
        return pm;
    }
}

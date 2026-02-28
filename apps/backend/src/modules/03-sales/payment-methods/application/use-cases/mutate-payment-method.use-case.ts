import { DBContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class MutatePaymentMethodUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(id: string, data: any, dbOrTx?: DBContext): Promise<PaymentMethod> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        return await this.repository.update(id, data, dbOrTx);
    }

    async disable(id: string, dbOrTx?: DBContext): Promise<void> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        await this.repository.update(id, { enabled: false }, dbOrTx);
    }
}

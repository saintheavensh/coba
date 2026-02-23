import { DBContext } from "../../../../shared/types/db-context";
import { IPaymentMethodRepository, IAccountGateway, PaymentVariantInput, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class VariantManagementUseCase {
    constructor(
        private readonly repository: IPaymentMethodRepository,
        private readonly accountGateway: IAccountGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async addVariant(methodId: string, input: PaymentVariantInput): Promise<PaymentMethod> {
        const pm = await this.repository.findById(methodId);
        if (!pm) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        const runInTransaction = async (tx: DBContext) => {
            const id = `PV-${Date.now()}`;

            // Auto-link or create account for variant (e.g. Bank BCA - Rekening Utama)
            const accountId = await this.accountGateway.ensureAccount(
                input.name,
                "transfer",
                input.accountId,
                tx
            );

            await this.repository.createVariant({
                id,
                methodId,
                name: input.name,
                accountNumber: input.accountNumber,
                accountHolder: input.accountHolder,
                accountId,
                enabled: true,
            }, tx);

            return await this.repository.findById(methodId, tx) as PaymentMethod;
        };

        return await this.db.transaction(runInTransaction);
    }

    async updateVariant(variantId: string, data: any, dbOrTx?: DBContext): Promise<void> {
        await this.repository.updateVariant(variantId, data, dbOrTx);
    }

    async disableVariant(variantId: string, dbOrTx?: DBContext): Promise<void> {
        await this.repository.updateVariant(variantId, { enabled: false }, dbOrTx);
    }
}

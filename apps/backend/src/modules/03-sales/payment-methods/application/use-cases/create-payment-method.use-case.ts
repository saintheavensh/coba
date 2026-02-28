import { DBContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, IAccountGateway, PaymentMethod, PaymentMethodInput } from "../../domain";

export class CreatePaymentMethodUseCase {
    constructor(
        private readonly repository: IPaymentMethodRepository,
        private readonly accountGateway: IAccountGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(input: PaymentMethodInput): Promise<PaymentMethod> {
        const runInTransaction = async (tx: DBContext) => {
            const id = `PM-${Date.now()}`;

            // Auto-link or create account
            const accountId = await this.accountGateway.ensureAccount(
                input.name,
                input.type,
                input.accountId,
                tx
            );

            return await this.repository.create({
                id,
                name: input.name,
                type: input.type,
                icon: input.icon,
                accountId,
                feeConfig: input.feeConfig,
                enabled: true,
            }, tx);
        };

        return await this.db.transaction(runInTransaction);
    }
}

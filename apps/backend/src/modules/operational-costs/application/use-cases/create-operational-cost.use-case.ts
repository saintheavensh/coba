import { DBContext } from "../../../../shared/types/db-context";
import { IOperationalCostRepository, IAccountingGateway, CreateOperationalCostInput } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateOperationalCostUseCase {
    constructor(
        private readonly repository: IOperationalCostRepository,
        private readonly accountingGateway: IAccountingGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(data: CreateOperationalCostInput, userId?: string): Promise<{ message: string; id: string }> {
        const amount = Number(data.amount) || 0;
        const date = data.date ? new Date(data.date) : new Date();
        const status = data.status || "paid";

        const newData = {
            category: data.category,
            amount: amount,
            date: date,
            description: data.description,
            status: status,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            paidAt: status === "paid" ? date : null,
            userId: userId || null
        };

        return await this.db.transaction(async (tx) => {
            // 1. Create Operational Cost
            const { id: costId } = await this.repository.create(newData, tx);

            // 2. Journal Entry (only if paid and account info provided)
            if (status === "paid" && data.sourceAccountId && data.expenseAccountId && amount > 0) {
                await this.accountingGateway.createJournal({
                    description: `Biaya Operasional: ${data.category}`,
                    referenceType: "expense",
                    referenceId: costId,
                    date: date,
                    lines: [
                        {
                            accountId: data.expenseAccountId,
                            debit: amount,
                            credit: 0,
                            description: `${data.category} - ${data.description || ''}`
                        },
                        {
                            accountId: data.sourceAccountId,
                            debit: 0,
                            credit: amount,
                            description: `Pembayaran ${data.category}`
                        }
                    ]
                }, userId, tx);
            }

            return { message: "Created", id: costId };
        });
    }
}

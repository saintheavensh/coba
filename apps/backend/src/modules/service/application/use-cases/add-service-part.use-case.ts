import { IServicePartRepository } from "../../domain/repositories/service-part-repository.port";

import { DBContext } from "../../../../shared/types/db-context";

export class AddServicePartUseCase {
    constructor(private readonly partRepository: IServicePartRepository, private readonly dbTx: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }) { }

    async execute(data: { serviceItemId: string; variantBatchId: string; quantity: number; sellingPrice: number; purchasePrice?: number; notes?: string }) {
        return this.dbTx.transaction(async (tx) => {
            const result = await this.partRepository.create({
                ...data
            }, tx);
            return { id: result.id, message: "Service part added" };
        });
    }
}

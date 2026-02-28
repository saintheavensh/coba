import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class AddServiceItemUseCase {
    constructor(private readonly itemRepository: IServiceItemRepository, private readonly dbTx: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }) { }

    async execute(data: { serviceId: string; serviceTypeId: string; technicianId?: string; description?: string; estimatedCost?: number }) {
        return this.dbTx.transaction(async (tx) => {
            const result = await this.itemRepository.create({
                ...data,
                status: "PENDING"
            }, tx);
            return { id: result.id, message: "Service item added" };
        });
    }
}

import { DBContext } from "../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class GetUnlinkedProductsUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(limit: number = 50, offset: number = 0, dbOrTx?: DBContext) {
        return await this.repository.getUnlinkedProducts(limit, offset, dbOrTx);
    }
}

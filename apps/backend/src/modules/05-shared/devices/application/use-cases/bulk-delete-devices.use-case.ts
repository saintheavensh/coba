import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class BulkDeleteDevicesUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(ids: string[], dbOrTx?: DBContext) {
        return await this.repository.bulkDelete(ids, dbOrTx);
    }
}

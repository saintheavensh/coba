import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository, IDeviceFilters } from "../../domain";

export class GetDevicesUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(filters: IDeviceFilters, dbOrTx?: DBContext) {
        return await this.repository.findAll(filters, dbOrTx);
    }
}

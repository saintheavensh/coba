import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IDeviceRepository, UpdateDeviceData } from "../../domain";

export class UpdateDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(id: string, data: UpdateDeviceData, dbOrTx?: DBContext) {
        const updateData = { ...data };
        if (data.brand) {
            updateData.brand = normalizeName(data.brand);
        }
        return await this.repository.update(id, updateData, dbOrTx);
    }
}

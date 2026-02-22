import { DBContext } from "../../../../shared/types/db-context";
import { IDeviceRepository } from "../../domain";

export class DeleteDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(id: string, dbOrTx?: DBContext) {
        return await this.repository.delete(id, dbOrTx);
    }
}

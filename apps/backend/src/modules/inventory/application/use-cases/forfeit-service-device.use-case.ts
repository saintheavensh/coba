import { IKanibalRepository, ForfeitedDevice } from "../../domain/repositories/kanibal-repository.port";
import { DBContext } from "../../../../shared/types/db-context";

export interface ForfeitServiceDeviceInput {
    serviceId: string;
    deviceName?: string;
    notes?: string;
}

export class ForfeitServiceDeviceUseCase {
    constructor(private readonly repository: IKanibalRepository) { }

    async execute(input: ForfeitServiceDeviceInput, _dbOrTx?: DBContext): Promise<ForfeitedDevice> {
        return await this.repository.saveForfeitedDevice({
            serviceId: input.serviceId,
            deviceName: input.deviceName ?? undefined,
            notes: input.notes ?? undefined,
            forfeitedDate: new Date(),
            status: 'UTUH'
        });
    }
}

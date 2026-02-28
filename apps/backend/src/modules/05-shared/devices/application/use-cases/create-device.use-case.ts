import { v4 as uuidv4 } from "uuid";
import { DBContext } from "../../../../../shared/types/db-context";
import { normalizeName } from "../../../../../shared/utils/normalize-name";
import { IDeviceRepository, CreateDeviceData } from "../../domain";
import { brandsFacade } from "../../../../02-inventory/brands/brands-container";

export class CreateDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }, dbOrTx?: DBContext) {
        // 1. Normalize brand name
        const normalizedBrand = normalizeName(data.brand);

        // 2. Ensure brand exists (using BrandsFacade)
        let brand = await brandsFacade.findByName(normalizedBrand);

        if (!brand) {
            const brandId = normalizedBrand.toLowerCase().replace(/\s+/g, '-');
            const createdBrands = await brandsFacade.create({
                id: brandId,
                name: normalizedBrand
            });
            brand = createdBrands[0];
        }

        // 3. Generate ID if not provided
        const id = data.id || `DEV-${uuidv4().substring(0, 8)}`;

        // 4. Create device
        const result = await this.repository.create({
            ...data,
            id,
            brand: normalizedBrand
        }, dbOrTx);

        return result;
    }
}

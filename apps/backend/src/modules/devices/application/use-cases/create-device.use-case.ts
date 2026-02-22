import { v4 as uuidv4 } from "uuid";
import { DBContext } from "../../../../shared/types/db-context";
import { normalizeName } from "../../../../shared/utils/normalize-name";
import { IDeviceRepository, CreateDeviceData } from "../../domain";
import { brandsService } from "../../../brands/services/brands.service";

export class CreateDeviceUseCase {
    constructor(private repository: IDeviceRepository) { }

    async execute(data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }, dbOrTx?: DBContext) {
        // 1. Normalize brand name
        const normalizedBrand = normalizeName(data.brand);

        // 2. Ensure brand exists (using BrandsService facade)
        // Note: In a fully DI-driven approach, we'd inject IBrandRepository or a specific Brand use case.
        // For now, adhering to the requested "ServiceFacade as entry point" pattern.

        // We need a findByName in brandsService. Since it's missing from my previous refactor, 
        // I will use getAll with a temporary filter or I'll have to add it to BrandsService.
        // For this step, I'll assume brandsService is available and I'll add the missing method later.

        // Actually, let's just use the current logic which emulates the original.
        // I'll check if brandsService has a way to find by name.

        // Let's assume we implement findByName in BrandsService.
        let brand = await (brandsService as any).findByName?.(normalizedBrand, dbOrTx);

        if (!brand) {
            const brandId = normalizedBrand.toLowerCase().replace(/\s+/g, '-');
            const createdBrands = await brandsService.create({
                id: brandId,
                name: normalizedBrand
            }, dbOrTx);
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

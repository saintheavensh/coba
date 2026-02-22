import { DBContext } from "../../../../shared/types/db-context";
import { IBrandRepository, Brand, CreateBrandData, UpdateBrandData } from "../../domain";
import { BrandsModel } from "../../models/brands.model";

export class BrandRepositoryAdapter implements IBrandRepository {
    private model: typeof BrandsModel;

    constructor() {
        this.model = BrandsModel;
    }

    async findAll(dbOrTx?: DBContext): Promise<Brand[]> {
        return await this.model.findAll(dbOrTx);
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Brand | null> {
        return await this.model.findById(id, dbOrTx);
    }

    async findByName(name: string, dbOrTx?: DBContext): Promise<Brand | null> {
        return await this.model.findByName(name, dbOrTx);
    }

    async create(data: CreateBrandData, dbOrTx?: DBContext): Promise<Brand[]> {
        return await this.model.create(data, dbOrTx);
    }

    async update(id: string, data: UpdateBrandData, dbOrTx?: DBContext): Promise<Brand[]> {
        return await this.model.update(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<Brand[]> {
        return await this.model.delete(id, dbOrTx);
    }
}

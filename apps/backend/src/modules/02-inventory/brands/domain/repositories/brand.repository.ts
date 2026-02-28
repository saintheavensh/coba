import { DBContext } from "../../../../../shared/types/db-context";
import { Brand, CreateBrandData, UpdateBrandData } from "../entities/brand.entity";

export interface IBrandRepository {
    findAll(dbOrTx?: DBContext): Promise<Brand[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Brand | null>;
    findByName(name: string, dbOrTx?: DBContext): Promise<Brand | null>;
    create(data: CreateBrandData, dbOrTx?: DBContext): Promise<Brand[]>;
    update(id: string, data: UpdateBrandData, dbOrTx?: DBContext): Promise<Brand[]>;
    delete(id: string, dbOrTx?: DBContext): Promise<Brand[]>;
}

import { DBContext } from "../../../../shared/types/db-context";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "../../domain";
import { SuppliersModel } from "../../models/suppliers.model";

export class SupplierRepositoryAdapter implements ISupplierRepository {
    private model: SuppliersModel;

    constructor() {
        this.model = new SuppliersModel();
    }

    async findAll(dbOrTx?: DBContext): Promise<Supplier[]> {
        return await this.model.findAll(dbOrTx) as Supplier[];
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Supplier | null> {
        const result = await this.model.findById(id, dbOrTx);
        return result as Supplier || null;
    }

    async getLinkedCategories(supplierId: string, dbOrTx?: DBContext): Promise<any[]> {
        return await this.model.getLinkedCategories(supplierId, dbOrTx);
    }

    async create(data: CreateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]> {
        return await this.model.create(data, dbOrTx) as Supplier[];
    }

    async update(id: string, data: UpdateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]> {
        return await this.model.update(id, data, dbOrTx) as Supplier[];
    }

    async delete(id: string, dbOrTx?: DBContext): Promise<any> {
        return await this.model.delete(id, dbOrTx);
    }

    async addCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        await this.model.addCategoryLink(supplierId, categoryId, dbOrTx);
    }

    async removeCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void> {
        await this.model.removeCategoryLink(supplierId, categoryId, dbOrTx);
    }
}

import { DBContext } from "../../../shared/types/db-context";
import { SupplierRepositoryAdapter } from "../infrastructure";
import {
    GetSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    LinkCategoryUseCase,
    UnlinkCategoryUseCase,
    GetSupplierCategoriesUseCase
} from "../application";
import { ISupplierRepository, CreateSupplierData, UpdateSupplierData } from "../domain";

export class SuppliersService {
    private repository: ISupplierRepository;
    private getSuppliersUseCase: GetSuppliersUseCase;
    private createSupplierUseCase: CreateSupplierUseCase;
    private updateSupplierUseCase: UpdateSupplierUseCase;
    private deleteSupplierUseCase: DeleteSupplierUseCase;
    private linkCategoryUseCase: LinkCategoryUseCase;
    private unlinkCategoryUseCase: UnlinkCategoryUseCase;
    private getSupplierCategoriesUseCase: GetSupplierCategoriesUseCase;

    constructor() {
        this.repository = new SupplierRepositoryAdapter();
        this.getSuppliersUseCase = new GetSuppliersUseCase(this.repository);
        this.createSupplierUseCase = new CreateSupplierUseCase(this.repository);
        this.updateSupplierUseCase = new UpdateSupplierUseCase(this.repository);
        this.deleteSupplierUseCase = new DeleteSupplierUseCase(this.repository);
        this.linkCategoryUseCase = new LinkCategoryUseCase(this.repository);
        this.unlinkCategoryUseCase = new UnlinkCategoryUseCase(this.repository);
        this.getSupplierCategoriesUseCase = new GetSupplierCategoriesUseCase(this.repository);
    }

    async getAll(dbOrTx?: DBContext) {
        return await this.getSuppliersUseCase.execute(dbOrTx);
    }

    async getLinkedCategories(supplierId: string, dbOrTx?: DBContext) {
        return await this.getSupplierCategoriesUseCase.execute(supplierId, dbOrTx);
    }

    async create(data: Omit<CreateSupplierData, 'id'>, dbOrTx?: DBContext) {
        return await this.createSupplierUseCase.execute(data, dbOrTx);
    }

    async update(id: string, data: UpdateSupplierData, dbOrTx?: DBContext) {
        return await this.updateSupplierUseCase.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: DBContext) {
        return await this.deleteSupplierUseCase.execute(id, dbOrTx);
    }

    async linkCategory(supplierId: string, categoryId: string, dbOrTx?: DBContext) {
        return await this.linkCategoryUseCase.execute(supplierId, categoryId, dbOrTx);
    }

    async unlinkCategory(supplierId: string, categoryId: string, dbOrTx?: DBContext) {
        return await this.unlinkCategoryUseCase.execute(supplierId, categoryId, dbOrTx);
    }
}

export const suppliersService = new SuppliersService();

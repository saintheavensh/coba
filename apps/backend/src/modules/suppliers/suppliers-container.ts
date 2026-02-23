import { SupplierRepositoryAdapter } from "./infrastructure";
import {
    GetSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    LinkCategoryUseCase,
    UnlinkCategoryUseCase,
    GetSupplierCategoriesUseCase
} from "./application";

// Adapters
const supplierRepository = new SupplierRepositoryAdapter();

// Use Cases
const getSuppliersUC = new GetSuppliersUseCase(supplierRepository);
const createSupplierUC = new CreateSupplierUseCase(supplierRepository);
const updateSupplierUC = new UpdateSupplierUseCase(supplierRepository);
const deleteSupplierUC = new DeleteSupplierUseCase(supplierRepository);
const linkCategoryUC = new LinkCategoryUseCase(supplierRepository);
const unlinkCategoryUC = new UnlinkCategoryUseCase(supplierRepository);
const getSupplierCategoriesUC = new GetSupplierCategoriesUseCase(supplierRepository);

/**
 * SuppliersService — Facade for external and presentation layers.
 */
export class SuppliersFacade {
    async getAll() {
        return await getSuppliersUC.execute();
    }

    async getLinkedCategories(supplierId: string) {
        return await getSupplierCategoriesUC.execute(supplierId);
    }

    async create(data: any) {
        return await createSupplierUC.execute(data);
    }

    async update(id: string, data: any) {
        return await updateSupplierUC.execute(id, data);
    }

    async delete(id: string) {
        return await deleteSupplierUC.execute(id);
    }

    async linkCategory(supplierId: string, categoryId: string) {
        return await linkCategoryUC.execute(supplierId, categoryId);
    }

    async unlinkCategory(supplierId: string, categoryId: string) {
        return await unlinkCategoryUC.execute(supplierId, categoryId);
    }
}

/** Singleton instance */
export const suppliersFacade = new SuppliersFacade();

export {
    getSuppliersUC,
    createSupplierUC,
    updateSupplierUC,
    deleteSupplierUC,
    linkCategoryUC,
    unlinkCategoryUC,
    getSupplierCategoriesUC
};

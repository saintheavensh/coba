import { SupplierRepositoryAdapter } from "./infrastructure";
import {
    GetSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    LinkCategoryUseCase,
    UnlinkCategoryUseCase,
    GetSupplierCategoriesUseCase,
    GetMappedProductVariantsUseCase,
    MapProductVariantUseCase,
    UnmapProductVariantUseCase
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
const getMappedProductVariantsUC = new GetMappedProductVariantsUseCase(supplierRepository);
const mapProductVariantUC = new MapProductVariantUseCase(supplierRepository);
const unmapProductVariantUC = new UnmapProductVariantUseCase(supplierRepository);

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

    async getMappedProductVariants(supplierId: string) {
        return await getMappedProductVariantsUC.execute(supplierId);
    }

    async mapProductVariant(supplierId: string, productId: string, variantId?: string | null) {
        return await mapProductVariantUC.execute(supplierId, productId, variantId);
    }

    async unmapProductVariant(supplierId: string, productId: string, variantId?: string | null) {
        return await unmapProductVariantUC.execute(supplierId, productId, variantId);
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
    getSupplierCategoriesUC,
    getMappedProductVariantsUC,
    mapProductVariantUC,
    unmapProductVariantUC
};

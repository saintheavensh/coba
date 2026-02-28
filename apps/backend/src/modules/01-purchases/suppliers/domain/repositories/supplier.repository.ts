import { DBContext } from "../../../../../shared/types/db-context";
import { Supplier, CreateSupplierData, UpdateSupplierData } from "../entities/supplier.entity";

export interface ISupplierRepository {
    findAll(dbOrTx?: DBContext): Promise<Supplier[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Supplier | null>;
    getLinkedCategories(supplierId: string, dbOrTx?: DBContext): Promise<any[]>;
    create(data: CreateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]>;
    update(id: string, data: UpdateSupplierData, dbOrTx?: DBContext): Promise<Supplier[]>;
    delete(id: string, dbOrTx?: DBContext): Promise<any>;
    addCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void>;
    removeCategoryLink(supplierId: string, categoryId: string, dbOrTx?: DBContext): Promise<void>;

    getMappedProductVariants(supplierId: string, dbOrTx?: DBContext): Promise<any[]>;
    mapProductVariant(supplierId: string, productId: string, variantId?: string | null, dbOrTx?: DBContext): Promise<void>;
    unmapProductVariant(supplierId: string, productId: string, variantId?: string | null, dbOrTx?: DBContext): Promise<void>;
}

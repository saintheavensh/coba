import { DBContext } from "../../../../shared/types/db-context";

export interface ICategoryRepository {
    findAll(dbOrTx?: DBContext): Promise<any[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<any | null>;
    create(data: any, dbOrTx?: DBContext): Promise<any>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<any>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;

    // Variant Template Operations
    addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext): Promise<any>;
    removeVariantTemplate(id: number, dbOrTx?: DBContext): Promise<void>;
    propagateVariantToProducts(categoryId: string, variantName: string, supplierId?: string, dbOrTx?: DBContext): Promise<void>;
}

import { DBContext } from "../../../../shared/types/db-context";
import { Category, CategoryVariant, CreateCategoryData, UpdateCategoryData } from "../entities/category.entity";

export interface ICategoryRepository {
    findAll(dbOrTx?: DBContext): Promise<Category[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Category | null>;
    create(data: CreateCategoryData, dbOrTx?: DBContext): Promise<Category>;
    update(id: string, data: UpdateCategoryData, dbOrTx?: DBContext): Promise<Category>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;

    // Variant Template Operations
    addVariantTemplate(categoryId: string, name: string, supplierId?: string, dbOrTx?: DBContext): Promise<CategoryVariant>;
    removeVariantTemplate(id: string, dbOrTx?: DBContext): Promise<void>;

    // Product Variant Granular Operations
    findProductsByCategory(categoryId: string, dbOrTx?: DBContext): Promise<{ id: string }[]>;
    productHasVariant(productId: string, variantName: string, dbOrTx?: DBContext): Promise<boolean>;
    addVariantToProduct(productId: string, variantName: string, dbOrTx?: DBContext): Promise<void>;
}

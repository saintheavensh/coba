/**
 * Port for category lookup (e.g. variant templates when creating a product).
 */
export interface CategoryWithTemplates {
    id: string;
    variantTemplates?: Array<{ name: string }>;
}

export interface ICategoryRepository {
    findById(id: string, dbOrTx?: unknown): Promise<CategoryWithTemplates | null>;
}

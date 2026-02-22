/**
 * Port for category lookup (e.g. variant templates when creating a product).
 */
import type { CategoryWithTemplates } from "./product.entity";

export interface ICategoryRepository {
    findById(id: string, dbOrTx?: unknown): Promise<CategoryWithTemplates | null>;
}

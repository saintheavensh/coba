import { DBContext } from "../../../../shared/types/db-context";

export interface IServiceCategoryRepository {
    findAll(dbOrTx?: DBContext): Promise<any[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<any | null>;
    create(data: { name: string; description?: string; minWeight?: number; maxWeight?: number }, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}

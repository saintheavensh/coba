import { DBContext } from "../../../../shared/types/db-context";

export interface IServiceTypeRepository {
    findAll(categoryId?: string, dbOrTx?: DBContext): Promise<any[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<any | null>;
    create(data: { categoryId: string; name: string; weight: number; defaultPrice?: number; commissionPercent?: number; warrantyDays?: number; isActive?: boolean }, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}

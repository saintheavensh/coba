import { DBContext } from "../../../../../shared/types/db-context";
import { OperationalCost } from "../entities/operational-cost.entity";

export interface IOperationalCostRepository {
    findAll(limit?: number, dbOrTx?: DBContext): Promise<OperationalCost[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<OperationalCost | null>;
    create(data: any, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}

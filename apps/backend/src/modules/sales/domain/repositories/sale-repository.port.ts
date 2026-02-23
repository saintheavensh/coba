import { DBContext } from "../../../../shared/types/db-context";
import { Sale } from "../entities/sale.entity";

export interface ISaleRepository {
    findAll(params: { startDate?: Date; endDate?: Date; search?: string; limit?: number }, dbOrTx?: DBContext): Promise<Sale[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Sale | null>;
    create(sale: any, dbOrTx?: DBContext): Promise<void>;
    createItem(item: any, dbOrTx?: DBContext): Promise<void>;
    createPayment(payment: any, dbOrTx?: DBContext): Promise<void>;
}
